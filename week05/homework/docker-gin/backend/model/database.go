package model

import (
	"fmt"
	"log"
	"time"

	"ai-vocabulary/config"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// InitDB 尝试连接数据库，并在连接成功后配置连接池参数。
// 这里只负责连库，不负责建表；建表逻辑在 docs/init.sql 中。
func InitDB() {
	dsn := config.GetDSN()
	var db *gorm.DB
	var err error

	// Docker 场景下数据库可能还没完全启动，所以这里最多重试 30 次。
	for i := 0; i < 30; i++ {
		db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		log.Printf("waiting for database... attempt %d/30", i+1)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		panic(fmt.Sprintf("failed to connect database: %v", err))
	}

	// 配置连接池，避免频繁创建和关闭连接。
	sqlDB, _ := db.DB()
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// 保存到全局变量，供 API 和 service 层直接使用。
	DB = db
	log.Println("database connected successfully")
}
