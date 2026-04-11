package model

import "time"

type Record struct {
	ID          int64
	Category    string
	Amount      float64
	Description string
	CreatedAt   time.Time
}
