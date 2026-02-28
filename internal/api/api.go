package api

import (
	"encoding/json"
	"net/http"

	"github.com/theb0imanuu/wida/internal/core"
	"github.com/theb0imanuu/wida/internal/scheduler"
	"github.com/theb0imanuu/wida/internal/store"
)

type Server struct {
	store     store.Store
	scheduler *scheduler.Scheduler
}

func NewServer(s store.Store) *Server {
	return &Server{store: s}
}

func (s *Server) SetScheduler(sched *scheduler.Scheduler) {
	s.scheduler = sched
}

func (s *Server) ServeMux() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/jobs/enqueue", s.HandleEnqueue)
	mux.HandleFunc("/api/jobs/", s.HandleGetJob) // Handles /api/jobs and /api/jobs/{id}
	mux.HandleFunc("/api/workers", s.HandleListWorkers)
	mux.HandleFunc("/api/dlq", s.HandleListDLQ)
	mux.HandleFunc("/api/scheduler", s.HandleGetScheduler)

	return s.corsMiddleware(mux)
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// HandleEnqueue handles job submission
func (s *Server) HandleEnqueue(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var job core.Job
	if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if job.Status == "" {
		job.Status = core.StatusPending
	}

	if err := s.store.Enqueue(r.Context(), &job); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(job)
}

// HandleListJobs represents listing jobs for the UI dashboard
func (s *Server) HandleListJobs(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// For simplicity, returning an empty list. In a real scenario, this would call s.store.ListJobs
	jobs, err := s.store.ListJobs(r.Context(), nil, 50, 0)
	if err != nil {
		// Mocked empty response for now
		jobs = []*core.Job{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"jobs": jobs,
	})
}

// HandleGetJob returns a single job
func (s *Server) HandleGetJob(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Because we mapped "/api/jobs/", it captures "/api/jobs" as well.
	if r.URL.Path == "/api/jobs" || r.URL.Path == "/api/jobs/" {
		s.HandleListJobs(w, r)
		return
	}

	jobID := r.URL.Path[len("/api/jobs/"):]
	if jobID == "" {
		http.Error(w, "Job ID required", http.StatusBadRequest)
		return
	}

	job, err := s.store.GetJob(r.Context(), jobID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if job == nil {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(job)
}

// HandleListWorkers representing active workers
func (s *Server) HandleListWorkers(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	workers, err := s.store.ListWorkers(r.Context())
	if err != nil {
		workers = []*core.WorkerStats{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"workers": workers,
	})
}

// HandleListDLQ returns dead letter jobs
func (s *Server) HandleListDLQ(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	dlq, err := s.store.ListDLQ(r.Context(), 50, 0)
	if err != nil {
		dlq = []*core.DLQJob{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"dlq": dlq,
	})
}

// HandleGetScheduler returns scheduler environment state
func (s *Server) HandleGetScheduler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	isLeader := false
	if s.scheduler != nil {
		isLeader = s.scheduler.IsLeader()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"is_leader": isLeader,
	})
}
