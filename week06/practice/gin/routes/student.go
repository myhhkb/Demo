package routes

import (
	"student-management/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterStudentRoutes(router *gin.Engine) {
	studentGroup := router.Group("/students")
	{
		studentGroup.POST("", controllers.CreateStudent)
		studentGroup.GET("", controllers.GetStudents)
		studentGroup.GET("/:id", controllers.GetStudentByID)
		studentGroup.PUT("/:id", controllers.UpdateStudent)
		studentGroup.DELETE("/:id", controllers.DeleteStudent)
	}
}
