package scheduler

import (
	"context"
	"log"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/theb0imanuu/wida/internal/store"
)

type Scheduler struct {
	pool     *pgxpool.Pool
	store    store.Store
	quit     chan struct{}
	isLeader atomic.Bool
}

func NewScheduler(pool *pgxpool.Pool, s store.Store) *Scheduler {
	return &Scheduler{
		pool:  pool,
		store: s,
		quit:  make(chan struct{}),
	}
}

func (s *Scheduler) IsLeader() bool {
	return s.isLeader.Load()
}

func (s *Scheduler) Start(ctx context.Context) {
	log.Println("Starting Wida Scheduler...")
	go s.runLeaderElection(ctx)
}

func (s *Scheduler) Stop() {
	close(s.quit)
}

func (s *Scheduler) runLeaderElection(ctx context.Context) {
	// A basic implementation of leader election using Postgres advisory locks.
	// We use an arbitrary lock ID (e.g., 999999) for the scheduler leader.
	const leaderLockID = 999999

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-s.quit:
			return
		case <-ticker.C:
			// Try to acquire the lock
			var acquired bool
			err := s.pool.QueryRow(ctx, "SELECT pg_try_advisory_lock($1)", leaderLockID).Scan(&acquired)
			if err != nil {
				log.Printf("Scheduler leader election error: %v\n", err)
				continue
			}

			if acquired {
				log.Println("Acquired Scheduler Leadership. Running evaluation loop...")
				s.isLeader.Store(true)
				s.runEvaluationLoop(ctx, leaderLockID)
				s.isLeader.Store(false)
				return // runEvaluationLoop blocks until ctx is done or lock is lost
			}
		}
	}
}

func (s *Scheduler) runEvaluationLoop(ctx context.Context, lockID int64) {
	defer func() {
		// Release the lock when exiting
		s.pool.Exec(context.Background(), "SELECT pg_advisory_unlock($1)", lockID)
		log.Println("Released Scheduler Leadership.")
	}()

	evalTicker := time.NewTicker(10 * time.Second)
	defer evalTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-s.quit:
			return
		case <-evalTicker.C:
			// 1. Evaluate CRON schedules
			s.evaluateCRON(ctx)

			// 2. Evaluate DAGs (advance dependent jobs if dependencies succeeded)
			s.evaluateDAGs(ctx)
		}
	}
}

func (s *Scheduler) evaluateCRON(ctx context.Context) {
	// Query jobs with CRON expressions that are due
	// and enqueue a new instance of them.
	// For simplicity, this is a placeholder.
}

func (s *Scheduler) evaluateDAGs(ctx context.Context) {
	// Query jobs that are pending and have dependencies.
	// If all dependencies are 'success', clear the dependencies array
	// so the worker pool can pick them up.

	query := `
		UPDATE wida_jobs w1
		SET dependencies = '[]'::jsonb
		WHERE status = 'pending'
		  AND dependencies IS NOT NULL
		  AND jsonb_typeof(dependencies) = 'array'
		  AND jsonb_array_length(dependencies) > 0
		  AND NOT EXISTS (
		      SELECT 1 FROM jsonb_array_elements_text(w1.dependencies) AS dep_id
		      JOIN wida_jobs w2 ON w2.id = dep_id
		      WHERE w2.status != 'success'
		  )
	`
	res, err := s.pool.Exec(ctx, query)
	if err != nil {
		log.Printf("DAG evaluation error: %v\n", err)
		return
	}

	rowsAffected := res.RowsAffected()
	if rowsAffected > 0 {
		log.Printf("Advanced %d DAG jobs to runnable state\n", rowsAffected)
	}
}
