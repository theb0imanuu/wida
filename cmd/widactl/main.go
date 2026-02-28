package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/theb0imanuu/wida/internal/core"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: widactl enqueue <queue> <payload>")
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "enqueue":
		if len(os.Args) < 4 {
			fmt.Println("Usage: widactl enqueue <queue> <payload>")
			os.Exit(1)
		}
		queue := os.Args[2]
		payload := os.Args[3]

		job := core.Job{
			ID:      fmt.Sprintf("job-%d", time.Now().UnixNano()),
			Queue:   queue,
			Payload: json.RawMessage(payload),
			Status:  core.StatusPending,
		}

		jobBytes, _ := json.Marshal(job)
		resp, err := http.Post("http://localhost:8080/api/jobs/enqueue", "application/json", bytes.NewBuffer(jobBytes))
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusCreated {
			fmt.Println("Job enqueued successfully:", job.ID)
		} else {
			fmt.Printf("Failed to enqueue job, status code: %d\n", resp.StatusCode)
		}

	default:
		fmt.Println("Unknown command")
	}
}
