package store

import (
	"context"

	"github.com/theb0imanuu/wida/internal/core"
)

// Store defines the interface for interacting with the queue datastore
type Store interface {
	Enqueue(ctx context.Context, job *core.Job) error
	Dequeue(ctx context.Context, queues []string, workerID string) (*core.Job, error)
	Heartbeat(ctx context.Context, jobID string, workerID string) error
	UpdateStatus(ctx context.Context, jobID string, status core.Status, attempt *core.Attempt) error
	MoveToDLQ(ctx context.Context, jobID string, reason string) error
	GetJob(ctx context.Context, id string) (*core.Job, error)
	ListJobs(ctx context.Context, filter map[string]interface{}, limit, offset int) ([]*core.Job, error)
	ListDLQ(ctx context.Context, limit, offset int) ([]*core.DLQJob, error)
	RegisterWorker(ctx context.Context, workerID string) error
	UpdateWorkerStatus(ctx context.Context, workerID string, status string, currentJobID string) error
	IncrementWorkerJobs(ctx context.Context, workerID string) error
	ListWorkers(ctx context.Context) ([]*core.WorkerStats, error)
}
