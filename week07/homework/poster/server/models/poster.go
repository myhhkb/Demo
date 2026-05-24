package models

import (
	"time"

	"gorm.io/gorm"
)

type Poster struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	UserID    uint           `gorm:"index;not null" json:"user_id"`
	Title     string         `gorm:"size:255;default:'未命名海报'" json:"title"`
	Width     int            `gorm:"default:600" json:"width"`
	Height    int            `gorm:"default:800" json:"height"`
	Data      string         `gorm:"type:text" json:"data"`
	Thumbnail string         `gorm:"size:500" json:"thumbnail"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
