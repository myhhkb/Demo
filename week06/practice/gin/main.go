package main

import (
	"student-management/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	routes.RegisterStudentRoutes(router)
	router.Run(":8080")
}
