CREATE TABLE IF NOT EXISTS wida_jobs (
    id VARCHAR(128) PRIMARY KEY,
    queue VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    run_at TIMESTAMP WITH TIME ZONE,
    cron_expr VARCHAR(128),
    retry_policy JSONB NOT NULL,
    timeout BIGINT NOT NULL,
    max_retries INTEGER NOT NULL DEFAULT 0,
    attempts JSONB,
    dependencies JSONB,
    dependents JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    worker_id VARCHAR(128),
    last_heartbeat TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_wida_jobs_queue_status ON wida_jobs(queue, status);
CREATE INDEX IF NOT EXISTS idx_wida_jobs_worker_id ON wida_jobs(worker_id);
CREATE INDEX IF NOT EXISTS idx_wida_jobs_run_at ON wida_jobs(run_at);

-- Dead Letter Queue
CREATE TABLE IF NOT EXISTS wida_dlq (
    id VARCHAR(128) PRIMARY KEY,
    queue VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    reason TEXT,
    attempts JSONB,
    failed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wida_workers (
    id VARCHAR(128) PRIMARY KEY,
    status VARCHAR(32) NOT NULL DEFAULT 'alive',
    current_job_id VARCHAR(128),
    jobs_completed INTEGER NOT NULL DEFAULT 0,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
