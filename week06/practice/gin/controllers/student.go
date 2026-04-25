package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"student-management/models"

	"github.com/gin-gonic/gin"
)

var students = make([]models.Student, 0)

func CreateStudent(c *gin.Context) {
	fmt.Println("接收到创建学生请求")

	var student models.Student
	if err := c.ShouldBindJSON(&student); err != nil {
		fmt.Printf("创建学生失败，数据绑定错误: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误", "detail": err.Error()})
		return
	}

	students = append(students, student)
	fmt.Printf("创建学生成功: %+v\n", student)

	c.JSON(http.StatusCreated, gin.H{
		"message": "创建学生信息成功",
		"data":    student,
	})
}

func GetStudents(c *gin.Context) {
	fmt.Println("接收到获取所有学生请求")
	fmt.Printf("返回学生列表，数量: %d\n", len(students))

	c.JSON(http.StatusOK, gin.H{"data": students})
}

func GetStudentByID(c *gin.Context) {
	fmt.Println("接收到获取单个学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	student, found := findStudentByID(id)
	if !found {
		fmt.Printf("获取学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	fmt.Printf("获取学生成功: %+v\n", student)
	c.JSON(http.StatusOK, gin.H{"data": student})
}

func UpdateStudent(c *gin.Context) {
	fmt.Println("接收到更新学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	index, found := findStudentIndexByID(id)
	if !found {
		fmt.Printf("更新学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	var req models.UpdateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("更新学生失败，数据绑定错误: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误", "detail": err.Error()})
		return
	}

	student := models.Student{
		ID:    id,
		Name:  req.Name,
		Age:   req.Age,
		Grade: req.Grade,
	}

	students[index] = student
	fmt.Printf("更新学生成功: %+v\n", student)

	c.JSON(http.StatusOK, gin.H{
		"message": "更新学生信息成功",
		"data":    student,
	})
}

func DeleteStudent(c *gin.Context) {
	fmt.Println("接收到删除学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	index, found := findStudentIndexByID(id)
	if !found {
		fmt.Printf("删除学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	deletedStudent := students[index]
	students = append(students[:index], students[index+1:]...)
	fmt.Printf("删除学生成功: %+v\n", deletedStudent)

	c.JSON(http.StatusOK, gin.H{"message": "删除学生信息成功"})
}

func parseStudentID(c *gin.Context) (int, bool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		fmt.Printf("请求失败，学生 ID 参数错误: %s\n", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "学生 id 必须是整数"})
		return 0, false
	}

	return id, true
}

func findStudentByID(id int) (models.Student, bool) {
	for _, student := range students {
		if student.ID == id {
			return student, true
		}
	}

	return models.Student{}, false
}

func findStudentIndexByID(id int) (int, bool) {
	for index, student := range students {
		if student.ID == id {
			return index, true
		}
	}

	return -1, false
}
