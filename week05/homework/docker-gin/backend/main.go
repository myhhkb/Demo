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
	config.Init()
	model.InitDB()

	r := gin.Default()

	r.POST("/api/register", api.Register)
	r.POST("/api/login", api.Login)

	auth := r.Group("/api", middleware.JWTAuth())
	{
		auth.POST("/word/query", api.QueryWord)
		auth.POST("/word/save", api.SaveWord)
		auth.GET("/words", api.GetWords)
		auth.DELETE("/word/:id", api.DeleteWord)
	}

	log.Println("server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		panic(err)
	}
}
