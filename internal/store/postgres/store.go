package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/theb0imanuu/wida/internal/core"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{
		pool: pool,
	}
}

func (s *Store) Enqueue(ctx context.Context, job *core.Job) error {
	payloadBytes, err := json.Marshal(job.Payload)
	if err != nil {
		return err
	}
	retryBytes, _ := json.Marshal(job.RetryPolicy)
	depsBytes, _ := json.Marshal(job.Dependencies)
	depsOutBytes, _ := json.Marshal(job.Dependents)

	query := `
		INSERT INTO wida_jobs 
		(id, queue, payload, status, run_at, cron_expr, retry_policy, timeout, max_retries, dependencies, dependents)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err = s.pool.Exec(ctx, query,
		job.ID, job.Queue, payloadBytes, job.Status,
		job.RunAt, job.CronExpr, retryBytes, int64(job.Timeout),
		job.MaxRetries, depsBytes, depsOutBytes,
	)
	return err
}

func (s *Store) Dequeue(ctx context.Context, queues []string, workerID string) (*core.Job, error) {
	// Simple dequeue: find a pending job or a job where run_at <= now()
	// SKIP LOCKED is critical for performance and removing deadlocks
	query := `
		UPDATE wida_jobs
		SET status = 'running', worker_id = $1, last_heartbeat = NOW()
		WHERE id = (
			SELECT id FROM wida_jobs
			WHERE status = 'pending' AND queue = ANY($2)
			  AND (run_at IS NULL OR run_at <= NOW())
			  AND (
				dependencies IS NULL 
				OR jsonb_typeof(dependencies) = 'null' 
				OR (jsonb_typeof(dependencies) = 'array' AND jsonb_array_length(dependencies) = 0)
			  )
			ORDER BY run_at ASC NULLS FIRST, created_at ASC
			FOR UPDATE SKIP LOCKED
			LIMIT 1
		)
		RETURNING id, queue, payload, status, run_at, cron_expr, retry_policy, timeout, max_retries, attempts, dependencies, dependents
	`

	row := s.pool.QueryRow(ctx, query, workerID, queues)

	var job core.Job
	var payloadBytes, retryBytes, attemptsBytes, depsBytes, depsOutBytes []byte
	var timeoutInt int64
	var cronExpr *string

	err := row.Scan(
		&job.ID, &job.Queue, &payloadBytes, &job.Status,
		&job.RunAt, &cronExpr, &retryBytes, &timeoutInt,
		&job.MaxRetries, &attemptsBytes, &depsBytes, &depsOutBytes,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // No jobs available
		}
		return nil, fmt.Errorf("failed to dequeue: %w", err)
	}

	job.Timeout = time.Duration(timeoutInt)
	json.Unmarshal(payloadBytes, &job.Payload)
	json.Unmarshal(retryBytes, &job.RetryPolicy)
	if attemptsBytes != nil {
		json.Unmarshal(attemptsBytes, &job.Attempts)
	}
	if depsBytes != nil {
		json.Unmarshal(depsBytes, &job.Dependencies)
	}
	if depsOutBytes != nil {
		json.Unmarshal(depsOutBytes, &job.Dependents)
	}
	if cronExpr != nil {
		job.CronExpr = *cronExpr
	}

	return &job, nil
}

func (s *Store) Heartbeat(ctx context.Context, jobID string, workerID string) error {
	query := `UPDATE wida_jobs SET last_heartbeat = NOW() WHERE id = $1 AND worker_id = $2 AND status = 'running'`
	_, err := s.pool.Exec(ctx, query, jobID, workerID)
	return err
}

func (s *Store) UpdateStatus(ctx context.Context, jobID string, status core.Status, attempt *core.Attempt) error {
	query := `
		UPDATE wida_jobs
		SET status = $1, 
		    attempts = COALESCE(attempts, '[]'::jsonb) || $2::jsonb
		WHERE id = $3
	`
	attemptBytes, _ := json.Marshal(attempt)
	_, err := s.pool.Exec(ctx, query, status, string(attemptBytes), jobID)
	return err
}

func (s *Store) MoveToDLQ(ctx context.Context, jobID string, reason string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Get job details
	var queue string
	var payloadBytes, attemptsBytes []byte
	err = tx.QueryRow(ctx, `SELECT queue, payload, attempts FROM wida_jobs WHERE id = $1`, jobID).
		Scan(&queue, &payloadBytes, &attemptsBytes)
	if err != nil {
		return err
	}

	// Insert into DLQ
	_, err = tx.Exec(ctx, `
		INSERT INTO wida_dlq (id, queue, payload, reason, attempts)
		VALUES ($1, $2, $3, $4, $5)
	`, jobID, queue, payloadBytes, reason, attemptsBytes)
	if err != nil {
		return err
	}

	// Delete from main jobs table
	_, err = tx.Exec(ctx, `DELETE FROM wida_jobs WHERE id = $1`, jobID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *Store) GetJob(ctx context.Context, id string) (*core.Job, error) {
	query := `
		SELECT id, queue, payload, status, run_at, cron_expr, retry_policy, timeout, max_retries, attempts, dependencies, dependents
		FROM wida_jobs
		WHERE id = $1
	`
	row := s.pool.QueryRow(ctx, query, id)

	var job core.Job
	var payloadBytes, retryBytes, attemptsBytes, depsBytes, depsOutBytes []byte
	var timeoutInt int64
	var cronExpr *string

	err := row.Scan(
		&job.ID, &job.Queue, &payloadBytes, &job.Status,
		&job.RunAt, &cronExpr, &retryBytes, &timeoutInt,
		&job.MaxRetries, &attemptsBytes, &depsBytes, &depsOutBytes,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // Not found
		}
		return nil, err
	}

	if cronExpr != nil {
		job.CronExpr = *cronExpr
	}
	job.Timeout = time.Duration(timeoutInt)
	json.Unmarshal(payloadBytes, &job.Payload)
	json.Unmarshal(retryBytes, &job.RetryPolicy)
	if attemptsBytes != nil {
		json.Unmarshal(attemptsBytes, &job.Attempts)
	}
	if depsBytes != nil {
		json.Unmarshal(depsBytes, &job.Dependencies)
	}
	if depsOutBytes != nil {
		json.Unmarshal(depsOutBytes, &job.Dependents)
	}

	return &job, nil
}

func (s *Store) ListJobs(ctx context.Context, filter map[string]interface{}, limit, offset int) ([]*core.Job, error) {
	query := `
		SELECT id, queue, payload, status, run_at, cron_expr, retry_policy, timeout, max_retries, attempts, dependencies, dependents
		FROM wida_jobs
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := s.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []*core.Job
	for rows.Next() {
		var job core.Job
		var payloadBytes, retryBytes, attemptsBytes, depsBytes, depsOutBytes []byte
		var timeoutInt int64
		var cronExpr *string

		err := rows.Scan(
			&job.ID, &job.Queue, &payloadBytes, &job.Status,
			&job.RunAt, &cronExpr, &retryBytes, &timeoutInt,
			&job.MaxRetries, &attemptsBytes, &depsBytes, &depsOutBytes,
		)
		if err != nil {
			return nil, err
		}

		if cronExpr != nil {
			job.CronExpr = *cronExpr
		}

		job.Timeout = time.Duration(timeoutInt)
		json.Unmarshal(payloadBytes, &job.Payload)
		json.Unmarshal(retryBytes, &job.RetryPolicy)
		if attemptsBytes != nil {
			json.Unmarshal(attemptsBytes, &job.Attempts)
		}
		jobs = append(jobs, &job)
	}

	return jobs, nil
}

func (s *Store) ListDLQ(ctx context.Context, limit, offset int) ([]*core.DLQJob, error) {
	query := `
		SELECT id, queue, payload, reason, attempts, failed_at
		FROM wida_dlq
		ORDER BY failed_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := s.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []*core.DLQJob
	for rows.Next() {
		var job core.DLQJob
		var payloadBytes, attemptsBytes []byte

		err := rows.Scan(
			&job.ID, &job.Queue, &payloadBytes, &job.Reason,
			&attemptsBytes, &job.FailedAt,
		)
		if err != nil {
			return nil, err
		}

		json.Unmarshal(payloadBytes, &job.Payload)
		if attemptsBytes != nil {
			json.Unmarshal(attemptsBytes, &job.Attempts)
		}
		jobs = append(jobs, &job)
	}
	return jobs, nil
}

func (s *Store) RegisterWorker(ctx context.Context, workerID string) error {
	query := `
		INSERT INTO wida_workers (id, status, last_heartbeat)
		VALUES ($1, 'alive', NOW())
		ON CONFLICT (id) DO UPDATE SET status = 'alive', last_heartbeat = NOW()
	`
	_, err := s.pool.Exec(ctx, query, workerID)
	return err
}

func (s *Store) UpdateWorkerStatus(ctx context.Context, workerID string, status string, currentJobID string) error {
	query := `
		UPDATE wida_workers 
		SET status = $1, current_job_id = $2, last_heartbeat = NOW()
		WHERE id = $3
	`
	var jobID *string
	if currentJobID != "" {
		jobID = &currentJobID
	}
	_, err := s.pool.Exec(ctx, query, status, jobID, workerID)
	return err
}

func (s *Store) IncrementWorkerJobs(ctx context.Context, workerID string) error {
	query := `UPDATE wida_workers SET jobs_completed = jobs_completed + 1, last_heartbeat = NOW() WHERE id = $1`
	_, err := s.pool.Exec(ctx, query, workerID)
	return err
}

func (s *Store) ListWorkers(ctx context.Context) ([]*core.WorkerStats, error) {
	query := `
		SELECT id, status, current_job_id, jobs_completed, last_heartbeat
		FROM wida_workers
		ORDER BY id ASC
	`
	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workers []*core.WorkerStats
	for rows.Next() {
		var w core.WorkerStats
		var currentJobID *string

		err := rows.Scan(&w.ID, &w.Status, &currentJobID, &w.JobsCompleted, &w.LastHeartbeat)
		if err != nil {
			return nil, err
		}
		if currentJobID != nil {
			w.CurrentJobID = *currentJobID
		}
		workers = append(workers, &w)
	}
	return workers, nil
}
