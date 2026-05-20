package model

import (
	"time"

	"gorm.io/gorm"
)

// User 对应 users 表，保存注册用户的基础信息。
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"type:varchar(64);uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"type:varchar(255);not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Word 对应 words 表，保存每个用户收藏的单词及释义。
// 同一个用户下同一个单词只能保存一条，因此使用 user_id + word 的联合唯一索引。
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

// DB 是全局数据库连接对象，初始化后供各个 API 直接使用。
var DB *gorm.DB
