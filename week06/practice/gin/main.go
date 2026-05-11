package main

import (
	"fmt"
	"log"

	"student-management/db"
	"student-management/routes"
	routesV2 "student-management/routes/v2"
	routesV3 "student-management/routes/v3"
	routesV4 "student-management/routes/v4"

	"github.com/gin-gonic/gin"
)

func main() {
	if err := db.InitSQLite(); err != nil {
		log.Fatalf("初始化 SQLite 失败: %v", err)
	}

	if err := db.InitMySQL(); err != nil {
		log.Fatalf("初始化 MySQL 失败: %v", err)
	}

	if err := db.InitRedis(); err != nil {
		log.Fatalf("初始化 Redis 失败: %v", err)
	}

	router := gin.Default()
	routes.RegisterStudentRoutes(router)
	routesV2.RegisterStudentRoutes(router)
	routesV3.RegisterStudentRoutes(router)
	routesV4.RegisterStudentRoutes(router)

	fmt.Println("学生信息管理系统启动，监听端口 :8081")
	if err := router.Run(":8081"); err != nil {
		log.Fatalf("启动服务失败: %v", err)
	}
}
