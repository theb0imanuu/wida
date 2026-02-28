export interface Attempt {
  started_at: string;
  finished_at?: string;
  status: string;
  error?: string;
}

export interface RetryPolicy {
  initial_interval: number;
  max_interval: number;
  max_attempts: number;
}

export interface Job {
  id: string;
  queue: string;
  payload: Record<string, unknown>;
  status: string;
  max_retries: number;
  attempts: Attempt[];
  dependencies?: string[];
  dependents?: string[];
  run_at?: string;
  cron_expr?: string;
  retry_policy: RetryPolicy;
  timeout: number;
}

export interface WorkerStats {
  id: string;
  status: string;
  current_job_id?: string;
  jobs_completed: number;
  last_heartbeat: string;
}

export interface DLQJob {
  id: string;
  queue: string;
  payload: Record<string, unknown>;
  reason: string;
  attempts: Attempt[];
  failed_at: string;
}

export interface GlobalStats {
  totalJobs: number;
  runningJobs: number;
  failedJobs: number;
  deadJobs: number;
}
