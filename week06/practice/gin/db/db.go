package db

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	"student-management/models"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	_ "modernc.org/sqlite"
)

var SQLiteDB *sql.DB
var MySQLDB *gorm.DB
var RedisClient *redis.Client

func InitSQLite() error {
	dsn := getenv("SQLITE_DSN", "students.db")

	database, err := sql.Open("sqlite", dsn)
	if err != nil {
		return fmt.Errorf("打开 SQLite 数据库失败: %w", err)
	}

	if err := database.Ping(); err != nil {
		return fmt.Errorf("连接 SQLite 数据库失败: %w", err)
	}

	createTableSQL := `
CREATE TABLE IF NOT EXISTS students (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	age INTEGER NOT NULL,
	grade TEXT NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`
	if _, err := database.Exec(createTableSQL); err != nil {
		return fmt.Errorf("初始化 SQLite 学生表失败: %w", err)
	}

	SQLiteDB = database
	fmt.Println("SQLite 数据库初始化成功")
	return nil
}

func InitMySQL() error {
	dsn := getenv("MYSQL_DSN", "root:password@tcp(127.0.0.1:3306)/student_management?charset=utf8mb4&parseTime=True&loc=Local")

	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("连接 MySQL 数据库失败: %w", err)
	}

	if err := database.AutoMigrate(&models.Student{}); err != nil {
		return fmt.Errorf("迁移 MySQL 学生表失败: %w", err)
	}

	MySQLDB = database
	fmt.Println("MySQL 数据库初始化成功")
	return nil
}

func InitRedis() error {
	addr := getenv("REDIS_ADDR", "127.0.0.1:6379")
	password := getenv("REDIS_PASSWORD", "")
	dbIndex := 0

	client := redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     password,
		DB:           dbIndex,
		DialTimeout:  3 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	if err := client.Ping(context.Background()).Err(); err != nil {
		return fmt.Errorf("连接 Redis 失败: %w", err)
	}

	RedisClient = client
	fmt.Println("Redis 客户端初始化成功")
	return nil
}

func getenv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
