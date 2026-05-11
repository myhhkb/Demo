package v2

import (
	controllers "student-management/controllers/v2"

	"github.com/gin-gonic/gin"
)

func RegisterStudentRoutes(router *gin.Engine) {
	studentGroup := router.Group("/v2/students")
	{
		studentGroup.POST("", controllers.CreateStudent)
		studentGroup.GET("", controllers.GetStudents)
		studentGroup.GET("/:id", controllers.GetStudentByID)
		studentGroup.PUT("/:id", controllers.UpdateStudent)
		studentGroup.DELETE("/:id", controllers.DeleteStudent)
	}
}
