package main

import (
	"log"

	"ai-vocabulary/api"
	"ai-vocabulary/config"
	"ai-vocabulary/middleware"
	"ai-vocabulary/model"

	"github.com/gin-gonic/gin"
)

func main() {
	// 先加载环境配置，再初始化数据库连接，保证后续业务代码可以直接使用配置和 DB。
	config.Init()
	model.InitDB()

	// gin.Default() 会创建一个带有日志和 Recovery 中间件的默认路由器。
	r := gin.Default()

	// 健康检查接口，用于确认服务是否已启动成功。
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 公开接口：注册和登录不需要先拿到 token。
	r.POST("/api/register", api.Register)
	r.POST("/api/login", api.Login)

	// 受保护接口：进入这个分组前必须先通过 JWT 鉴权中间件。
	auth := r.Group("/api", middleware.JWTAuth())
	{
		// 单词查询：先查自己是否已经保存过；没保存过则调用 AI。
		auth.POST("/word/query", api.QueryWord)
		// 保存单词到自己的词库。
		auth.POST("/word/save", api.SaveWord)
		// 获取当前用户的单词列表。
		auth.GET("/words", api.GetWords)
		// 删除某个已保存的单词。
		auth.DELETE("/word/:id", api.DeleteWord)
	}

	// 启动 HTTP 服务，监听 8080 端口。
	log.Println("server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		panic(err)
	}
}
