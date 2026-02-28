package core

import (
	"encoding/json"
	"time"
)

type Status string

const (
	StatusPending Status = "pending"
	StatusRunning Status = "running"
	StatusSuccess Status = "success"
	StatusFailed  Status = "failed"
	StatusDead    Status = "dead"
)

type Job struct {
	ID      string          `json:"id"`
	Queue   string          `json:"queue"`
	Payload json.RawMessage `json:"payload"`
	Status  Status          `json:"status"`

	RunAt       *time.Time  `json:"run_at,omitempty"`
	CronExpr    string      `json:"cron_expr,omitempty"`
	RetryPolicy RetryPolicy `json:"retry_policy"`

	Timeout    time.Duration `json:"timeout"`
	MaxRetries int           `json:"max_retries"`
	Attempts   []Attempt     `json:"attempts"`

	Dependencies []string `json:"dependencies,omitempty"`
	Dependents   []string `json:"dependents,omitempty"`
}

type Attempt struct {
	StartedAt  time.Time `json:"started_at"`
	FinishedAt time.Time `json:"finished_at,omitempty"`
	Status     Status    `json:"status"`
	Error      string    `json:"error,omitempty"`
}

type RetryPolicy struct {
	InitialInterval time.Duration `json:"initial_interval"`
	MaxInterval     time.Duration `json:"max_interval"`
	MaxAttempts     int           `json:"max_attempts"`
}

type WorkerStats struct {
	ID            string    `json:"id"`
	Status        string    `json:"status"`
	CurrentJobID  string    `json:"current_job_id,omitempty"`
	JobsCompleted int       `json:"jobs_completed"`
	LastHeartbeat time.Time `json:"last_heartbeat"`
}

type DLQJob struct {
	ID       string          `json:"id"`
	Queue    string          `json:"queue"`
	Payload  json.RawMessage `json:"payload"`
	Reason   string          `json:"reason"`
	Attempts []Attempt       `json:"attempts"`
	FailedAt time.Time       `json:"failed_at"`
}
