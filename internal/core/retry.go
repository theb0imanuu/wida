package core

import (
	"math"
	"math/rand"
	"time"
)

// CalculateRetryDelay uses exponential backoff with jitter
func CalculateRetryDelay(attempt int, policy RetryPolicy) time.Duration {
	if attempt <= 0 {
		return 0
	}

	delay := policy.InitialInterval * time.Duration(math.Pow(2, float64(attempt-1)))
	if policy.MaxInterval > 0 && delay > policy.MaxInterval {
		delay = policy.MaxInterval
	}

	// Add jitter (up to 50% of the delay)
	if delay > 0 {
		jitterMax := int64(delay) / 2
		if jitterMax > 0 {
			jitter := time.Duration(rand.Int63n(jitterMax))
			delay = delay + jitter
		}
	}

	return delay
}
