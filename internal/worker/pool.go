package worker

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/theb0imanuu/wida/internal/core"
	"github.com/theb0imanuu/wida/internal/store"
)

type Pool struct {
	ID        string
	Store     store.Store
	Queues    []string
	Workers   []*core.Worker
	Executors map[string]core.Executor // e.g., "docker", "http", "subprocess"
	wg        sync.WaitGroup
	quit      chan struct{}
}

func NewPool(id string, s store.Store, queues []string) *Pool {
	return &Pool{
		ID:        id,
		Store:     s,
		Queues:    queues,
		Executors: make(map[string]core.Executor),
		quit:      make(chan struct{}),
	}
}

func (p *Pool) RegisterExecutor(name string, e core.Executor) {
	p.Executors[name] = e
}

func (p *Pool) Start(ctx context.Context, numWorkers int) {
	log.Printf("Starting worker pool %s with %d workers\n", p.ID, numWorkers)
	for i := 0; i < numWorkers; i++ {
		w := core.NewWorker(fmt.Sprintf("%s-%d", p.ID, i), nil, 1) // simplistic approach
		p.Workers = append(p.Workers, w)

		p.wg.Add(1)
		go p.runWorker(ctx, w)
	}
}

func (p *Pool) Stop() {
	close(p.quit)
	p.wg.Wait()
}

func (p *Pool) runWorker(ctx context.Context, w *core.Worker) {
	defer p.wg.Done()

	p.Store.RegisterWorker(context.Background(), w.ID)

	pollTicker := time.NewTicker(2 * time.Second)
	defer pollTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-p.quit:
			return
		case <-pollTicker.C:
			// Attempt to dequeue a job
			job, err := p.Store.Dequeue(ctx, p.Queues, w.ID)
			if err != nil {
				log.Printf("Worker %s dequeue error: %v\n", w.ID, err)
				continue
			}
			if job == nil {
				continue // no jobs available
			}

			p.processJob(ctx, w, job)
		}
	}
}

func (p *Pool) processJob(ctx context.Context, w *core.Worker, job *core.Job) {
	log.Printf("Worker %s executing job %s from queue %s\n", w.ID, job.ID, job.Queue)

	p.Store.UpdateWorkerStatus(context.Background(), w.ID, "running", job.ID)
	defer p.Store.UpdateWorkerStatus(context.Background(), w.ID, "idle", "")

	// Create execution attempt
	attempt := &core.Attempt{
		StartedAt: time.Now(),
		Status:    core.StatusRunning,
	}

	// Determine executor type from somewhere (assume HTTP for now as default)
	executor := p.Executors["default"]

	// Start heartbeat routine
	hbCtx, hbCancel := context.WithCancel(ctx)
	go p.heartbeat(hbCtx, job.ID, w.ID)

	// Execute job
	execErr := executor.Execute(ctx, job)

	hbCancel()

	attempt.FinishedAt = time.Now()
	if execErr != nil {
		attempt.Status = core.StatusFailed
		attempt.Error = execErr.Error()
		log.Printf("Job %s failed on worker %s: %v\n", job.ID, w.ID, execErr)

		job.Status = core.StatusFailed
		job.Attempts = append(job.Attempts, *attempt)

		// Check Retry Policy
		if len(job.Attempts) >= job.MaxRetries {
			log.Printf("Job %s max retries reached. Moving to DLQ.\n", job.ID)
			p.Store.MoveToDLQ(ctx, job.ID, execErr.Error())
		} else {
			// Schedule next retry
			job.Status = core.StatusPending
			delay := core.CalculateRetryDelay(len(job.Attempts), job.RetryPolicy)
			nextRun := time.Now().Add(delay)
			job.RunAt = &nextRun
			p.Store.UpdateStatus(ctx, job.ID, core.StatusPending, attempt) // We might need a separate rescheduled method or just update status with run_at
			// TODO: Add proper reschedule logic in store to update run_at
		}
	} else {
		attempt.Status = core.StatusSuccess
		job.Status = core.StatusSuccess
		log.Printf("Job %s succeeded on worker %s\n", job.ID, w.ID)
		p.Store.UpdateStatus(ctx, job.ID, core.StatusSuccess, attempt)
	}

	p.Store.IncrementWorkerJobs(context.Background(), w.ID)
}

func (p *Pool) heartbeat(ctx context.Context, jobID, workerID string) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			p.Store.Heartbeat(context.Background(), jobID, workerID)
		}
	}
}
