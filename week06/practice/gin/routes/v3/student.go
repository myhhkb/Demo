package v3

import (
	controllers "student-management/controllers/v3"

	"github.com/gin-gonic/gin"
)

func RegisterStudentRoutes(router *gin.Engine) {
	studentGroup := router.Group("/v3/students")
	{
		studentGroup.POST("", controllers.CreateStudent)
		studentGroup.GET("", controllers.GetStudents)
		studentGroup.GET("/:id", controllers.GetStudentByID)
		studentGroup.PUT("/:id", controllers.UpdateStudent)
		studentGroup.DELETE("/:id", controllers.DeleteStudent)
	}
}
