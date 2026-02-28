<h1 align="center">Wida</h1>

<p align="center">
  <strong>A distributed, resilient job queue system built in Go, backed by PostgreSQL.</strong>
</p>

<p align="center">
  <a href="https://golang.org/"><img src="https://img.shields.io/badge/go-v1.22+-blue.svg" alt="Go Version"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/postgres-15+-blue.svg" alt="PostgreSQL"></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/UI-React--Tailwind-blueviolet.svg" alt="Frontend UI"></a>
</p>

## Overview

Wida is a highly scalable, robust distributed job queue system designed for modern applications. It solves the complexity of managing asynchronous workflows, scheduling recurring tasks, and enforcing execution constraints. Whether you need simple background job processing or complex workflows where jobs depend on the success of other jobs (DAGs), Wida provides the necessary tools and abstractions to build reliable, observable systems.

Wida uses Postgres (such as Neon serverless) as its primary durable queue store, taking advantage of rich features like advisory locks and JSONB for payload storage.

### The Problem It Solves

Modern applications require executing long-running tasks asynchronously, integrating disparate systems, and reliably recovering from transient failures.
Wida addresses:

- **Resilience**: Every job execution is tracked. When a failure occurs, Wida gracefully handles retries with exponential backoff and jitter to avoid overwhelming dependent services (thundering herd problem).
- **Execution Ordering (DAG)**: Often a job (e.g., `Send Email Summary`) cannot run until prerequisite jobs (`Calculate Metrics for User A`, `Calculate Metrics for User B`) complete. Wida's native Directed Acyclic Graph (DAG) support guarantees correct dependency resolution.
- **Scheduled and Recurring Jobs**: Support for precise CRON scheduling, aware of timezones, managed by a distributed leader-elected scheduler.
- **Dead Letter Queue (DLQ)**: Jobs that fail repeatedly are eventually moved to the DLQ where operators can analyze the `payload` and `errors`, trigger alerts, and optionally replay them manually.
- **Multi-Environment Execution**: Designed with an `Executor` interface that allows a worker to run a job within a subprocess, an HTTP webhook, or even orchestrate a Docker/Kubernetes pod.

## Features

- 🏗 **Architecture**: Leader-elected scheduler, distributed worker pool, fast queue processing using Postgres `SKIP LOCKED`.
- 🔄 **Retry Mechanics**: Built-in exponential backoff up to a `MaxInterval` with randomization (jitter).
- 🔗 **DAG Execution**: Define `Dependencies` and `Dependents` to chain complex workloads automatically.
- 🕒 **CRON Engine**: Timezone-aware recurring tasks.
- 🗄 **Dead Letter Queue**: Catch exhausted jobs and tie up alerts via webhooks or email integrations.
- 📈 **Observability**: Heartbeats, Worker liveness status, and attempt history tracked per-job.
- 💻 **CLI & API**: Enqueue, retry, pause, and drop jobs programmatically or from the terminal.
- 📊 **Modern Dashboard**: A real-time responsive React/Tailwind frontend to visualize job throughput, worker pools, queues, and the DAG execution graph.

## System Architecture

**Data Flow**:
`Client` -> `API / CLI` -> `Postgres Store` -> `Scheduler / Worker Pool` -> `Executor` -> `Status Update`

- **Scheduler**: A single leader evaluates CRON schedules and advances DAG states when dependencies succeed.
- **Worker Pool**: Scales horizontally. Workers poll using long-polling or fast pub/sub to grab `pending` jobs, limiting concurrency via internal semaphores.

## Setup & Local Development

### Prerequisites

- [Go 1.22+](https://golang.org/doc/install)
- [Node.js v18+](https://nodejs.org/) & `npm` or `yarn` (for the Dashboard)
- [PostgreSQL](https://www.postgresql.org/download/) initialized (or a Neon DB connection string)

### 1. Initialize the Backend (Go)

```bash
# Clone the repository
git clone https://github.com/theb0imanuu/wida.git
cd wida

# Download dependencies
go mod tidy
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
WIDA_DATABASE_URL=postgres://user:pass@localhost:5432/wida?sslmode=disable
WIDA_PORT=8080
WIDA_WORKER_CONCURRENCY=5
```

### 3. Run the Server & Workers

Start the combined daemon (API, Scheduler leader-election, and Workers):

```bash
go run cmd/widad/main.go
```

### 4. Run the Dashboard (React UI)

In a separate terminal block, navigate to the `ui` directory:

```bash
cd ui
npm install
npm run dev
```

The modern layout dashboard will be available at `http://localhost:5173`.

## Architecture Details

- **Queue Store**: Implements the `Listen`/`Notify` alongside `SELECT FOR UPDATE SKIP LOCKED` for lock-free parallel dequeueing.
- **Scheduler Leader Election**: Utilizing `pg_advisory_lock` to ensure only one instance ever writes CRON-instantiated jobs to avoid duplication.

## License

MIT License.
