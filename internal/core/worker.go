package core

import "context"

type Executor interface {
	Execute(ctx context.Context, job *Job) error
}

type Worker struct {
	ID       string
	Executor Executor
	Sem      chan struct{}
	StopCh   chan struct{}
}

func NewWorker(id string, executor Executor, maxConcurrency int) *Worker {
	return &Worker{
		ID:       id,
		Executor: executor,
		Sem:      make(chan struct{}, maxConcurrency),
		StopCh:   make(chan struct{}),
	}
}

func (w *Worker) Run(ctx context.Context) {
	// Worker run loop implementation
}
