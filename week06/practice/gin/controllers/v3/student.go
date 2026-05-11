package v3

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"student-management/db"
	"student-management/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreateStudent(c *gin.Context) {
	fmt.Println("v3 接收到创建学生请求")

	var student models.Student
	if err := c.ShouldBindJSON(&student); err != nil {
		fmt.Printf("v3 创建学生失败，数据绑定错误: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误", "detail": err.Error()})
		return
	}

	if err := db.MySQLDB.Create(&student).Error; err != nil {
		fmt.Printf("v3 创建学生失败，GORM 执行错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建学生信息失败", "detail": err.Error()})
		return
	}

	fmt.Printf("v3 创建学生成功: %+v\n", student)
	c.JSON(http.StatusCreated, gin.H{"message": "创建学生信息成功", "data": student})
}

func GetStudents(c *gin.Context) {
	fmt.Println("v3 接收到获取所有学生请求")

	students := make([]models.Student, 0)
	if err := db.MySQLDB.Order("id ASC").Find(&students).Error; err != nil {
		fmt.Printf("v3 获取学生列表失败，GORM 查询错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取学生列表失败", "detail": err.Error()})
		return
	}

	fmt.Printf("v3 返回学生列表，数量: %d\n", len(students))
	c.JSON(http.StatusOK, gin.H{"data": students})
}

func GetStudentByID(c *gin.Context) {
	fmt.Println("v3 接收到获取单个学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	student, found, err := findStudentByID(id)
	if err != nil {
		fmt.Printf("v3 获取学生失败，GORM 查询错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取学生信息失败", "detail": err.Error()})
		return
	}
	if !found {
		fmt.Printf("v3 获取学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	fmt.Printf("v3 获取学生成功: %+v\n", student)
	c.JSON(http.StatusOK, gin.H{"data": student})
}

func UpdateStudent(c *gin.Context) {
	fmt.Println("v3 接收到更新学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	var req models.UpdateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("v3 更新学生失败，数据绑定错误: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误", "detail": err.Error()})
		return
	}

	student, found, err := findStudentByID(id)
	if err != nil {
		fmt.Printf("v3 更新学生失败，GORM 查询错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询学生信息失败", "detail": err.Error()})
		return
	}
	if !found {
		fmt.Printf("v3 更新学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	student.Name = req.Name
	student.Age = req.Age
	student.Grade = req.Grade
	if err := db.MySQLDB.Save(&student).Error; err != nil {
		fmt.Printf("v3 更新学生失败，GORM 执行错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新学生信息失败", "detail": err.Error()})
		return
	}

	fmt.Printf("v3 更新学生成功: %+v\n", student)
	c.JSON(http.StatusOK, gin.H{"message": "更新学生信息成功", "data": student})
}

func DeleteStudent(c *gin.Context) {
	fmt.Println("v3 接收到删除学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	result := db.MySQLDB.Delete(&models.Student{}, id)
	if result.Error != nil {
		fmt.Printf("v3 删除学生失败，GORM 执行错误: %v\n", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除学生信息失败", "detail": result.Error.Error()})
		return
	}
	if result.RowsAffected == 0 {
		fmt.Printf("v3 删除学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	fmt.Printf("v3 删除学生成功，ID: %d\n", id)
	c.JSON(http.StatusOK, gin.H{"message": "删除学生信息成功"})
}

func parseStudentID(c *gin.Context) (int, bool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		fmt.Printf("v3 请求失败，学生 ID 参数错误: %s\n", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "学生 id 必须是整数"})
		return 0, false
	}
	return id, true
}

func findStudentByID(id int) (models.Student, bool, error) {
	var student models.Student
	err := db.MySQLDB.First(&student, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return models.Student{}, false, nil
	}
	if err != nil {
		return models.Student{}, false, err
	}
	return student, true, nil
}
