package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"type:varchar(64);uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"type:varchar(255);not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Word struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	UserID     uint           `json:"user_id" gorm:"uniqueIndex:uk_user_word;index;not null"`
	Word       string         `json:"word" gorm:"type:varchar(128);uniqueIndex:uk_user_word;index;not null"`
	Definition string         `json:"definition" gorm:"type:text;not null"`
	Examples   string         `json:"examples" gorm:"type:text;not null"`
	AIProvider string         `json:"ai_provider" gorm:"column:ai_provider;type:varchar(32)"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

var DB *gorm.DB
