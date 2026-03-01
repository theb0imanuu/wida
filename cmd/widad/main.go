package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/theb0imanuu/wida/internal/api"
	"github.com/theb0imanuu/wida/internal/core"
	"github.com/theb0imanuu/wida/internal/scheduler"
	"github.com/theb0imanuu/wida/internal/store/postgres"
	"github.com/theb0imanuu/wida/internal/worker"
)

type MockExecutor struct{}

func (m *MockExecutor) Execute(ctx context.Context, job *core.Job) error {
	log.Printf("MockExecutor: Executing job %s...\n", job.ID)
	return nil
}

func main() {
	log.Println("Starting Wida Server daemon (widad)")

	// Explicitly load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Error loading .env file: %v\n", err)
	}

	dbURL := os.Getenv("WIDA_DATABASE_URL")
	if dbURL == "" {
		log.Println("Warning: WIDA_DATABASE_URL not set, falling back to localhost")
		dbURL = "postgres://postgres:postgres@localhost:5432/wida?sslmode=disable"
	} else {
		log.Println("Successfully loaded WIDA_DATABASE_URL from environment")
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	schemaBytes, err := os.ReadFile("internal/store/postgres/schema.sql")
	if err == nil {
		if _, err := pool.Exec(ctx, string(schemaBytes)); err != nil {
			log.Printf("Warning: Failed to execute schema.sql: %v\n", err)
		} else {
			log.Println("Database schema verified and initialized.")
		}
	} else {
		log.Printf("Warning: Could not read schema.sql: %v\n", err)
	}

	store := postgres.NewStore(pool)
	apiServer := api.NewServer(store)

	port := os.Getenv("WIDA_PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: apiServer.ServeMux(),
	}
	go func() {
		log.Printf("Listening on :%s\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("API server failure: %v\n", err)
		}
	}()

	sched := scheduler.NewScheduler(pool, store)
	sched.Start(ctx)
	apiServer.SetScheduler(sched)

	concurrency := 5
	if c := os.Getenv("WIDA_WORKER_CONCURRENCY"); c != "" {
		if val, err := strconv.Atoi(c); err == nil {
			concurrency = val
		}
	}

	queues := []string{"default", "high", "low"}
	workerPool := worker.NewPool("widad-node-1", store, queues)
	workerPool.RegisterExecutor("default", &MockExecutor{})
	workerPool.Start(ctx, concurrency)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	<-sigChan
	log.Println("Shutting down widad...")

	srv.Shutdown(ctx)
	workerPool.Stop()
	sched.Stop()
	cancel()
}
