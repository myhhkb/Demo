package models

import "time"

type Student struct {
	ID        int       `json:"id" gorm:"primaryKey" binding:"required"`
	Name      string    `json:"name" gorm:"type:varchar(100);not null" binding:"required"`
	Age       int       `json:"age" gorm:"not null" binding:"required"`
	Grade     string    `json:"grade" gorm:"type:varchar(50);not null" binding:"required"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

type UpdateStudentRequest struct {
	Name  string `json:"name" binding:"required"`
	Age   int    `json:"age" binding:"required"`
	Grade string `json:"grade" binding:"required"`
}
