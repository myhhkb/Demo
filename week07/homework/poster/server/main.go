package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"poster-server/handlers"
	"poster-server/middleware"
	"poster-server/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	godotenv.Load("../.env")

	models.InitDB()

	r := gin.Default()

	store := cookie.NewStore([]byte("poster-secret-key-2024"))
	store.Options(sessions.Options{
		MaxAge:   86400 * 7,
		Path:     "/",
		HttpOnly: true,
	})
	r.Use(sessions.Sessions("poster_session", store))

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.MaxMultipartMemory = 32 << 20

	r.Static("/uploads", "./uploads")

	api := r.Group("/api")
	{
		api.POST("/register", handlers.Register)
		api.POST("/login", handlers.Login)
		api.GET("/user", middleware.AuthRequired(), handlers.GetUser)
		api.POST("/logout", middleware.AuthRequired(), handlers.Logout)

		api.POST("/posters", middleware.AuthRequired(), handlers.SavePoster)
		api.GET("/posters", middleware.AuthRequired(), handlers.GetPosters)
		api.GET("/posters/:id", middleware.AuthRequired(), handlers.GetPoster)
		api.DELETE("/posters/:id", middleware.AuthRequired(), handlers.DeletePoster)

		api.POST("/upload", middleware.AuthRequired(), handlers.UploadFile)
		api.GET("/oss/upload-policy", middleware.AuthRequired(), handlers.GetUploadPolicy)
		api.GET("/oss/signed-url", middleware.AuthRequired(), handlers.GetSignedURL)
		api.POST("/ai/generate-image", middleware.AuthRequired(), handlers.GenerateImage)
	}

	distPath := "./dist"
	if _, err := os.Stat(distPath); err == nil {
		r.Static("/assets", filepath.Join(distPath, "assets"))
		r.StaticFile("/vite.svg", filepath.Join(distPath, "vite.svg"))
		r.NoRoute(func(c *gin.Context) {
			c.File(filepath.Join(distPath, "index.html"))
		})
	} else {
		r.NoRoute(func(c *gin.Context) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}
