package routes

import (
	"student-management/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterStudentRoutes(router *gin.Engine) {
	registerV1StudentRoutes(router.Group("/students"))
	registerV1StudentRoutes(router.Group("/v1/students"))
}

func registerV1StudentRoutes(studentGroup *gin.RouterGroup) {
	studentGroup.POST("", controllers.CreateStudent)
	studentGroup.GET("", controllers.GetStudents)
	studentGroup.GET("/:id", controllers.GetStudentByID)
	studentGroup.PUT("/:id", controllers.UpdateStudent)
	studentGroup.DELETE("/:id", controllers.DeleteStudent)
}
