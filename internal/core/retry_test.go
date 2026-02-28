package core

import (
	"testing"
	"time"
)

func TestCalculateRetryDelay(t *testing.T) {
	policy := RetryPolicy{
		InitialInterval: 1 * time.Second,
		MaxInterval:     10 * time.Second,
	}

	delay1 := CalculateRetryDelay(1, policy)
	if delay1 < 1*time.Second || delay1 > time.Duration(1.5*float64(time.Second)) {
		t.Errorf("Expected delay1 around 1s, got %v", delay1)
	}

	delay3 := CalculateRetryDelay(3, policy)
	// Base is 4s, jitter up to 2s
	if delay3 < 4*time.Second || delay3 > 6*time.Second {
		t.Errorf("Expected delay3 around 4s-6s, got %v", delay3)
	}

	delay10 := CalculateRetryDelay(10, policy)
	// Max interval is 10s, jitter up to 5s
	if delay10 < 10*time.Second || delay10 > 15*time.Second {
		t.Errorf("Expected delay10 bounded by MaxInterval+Jitter (10s-15s), got %v", delay10)
	}
}
