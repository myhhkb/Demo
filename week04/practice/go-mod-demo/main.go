package main

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// main 是程序入口。
// 这个示例演示了如何使用 go.mod 管理第三方依赖，
// 并结合 Gin 快速启动一个最简单的 Web 服务。
func main() {
	// gin.Default() 会创建一个带有默认中间件的路由引擎。
	// 默认中间件通常包括：
	// - 日志中间件：记录请求信息
	// - 恢复中间件：程序 panic 时避免整个服务崩掉
	r := gin.Default()

	// 注册一个 GET 接口：/api/v1/uuid
	// 当前端或浏览器访问这个地址时，会执行下面这个函数。
	r.GET("/api/v1/uuid", func(c *gin.Context) {
		// 返回一段 JSON 数据。
		// uuid.New().String() 会生成一个全新的唯一标识符。
		c.JSON(200, gin.H{
			"uuid": uuid.New().String(),
		})
	})

	// 启动 Web 服务，监听 8080 端口。
	// 启动后可以访问：http://localhost:8080/api/v1/uuid
	r.Run(":8080")
}
