package v2

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"

	"student-management/db"
	"student-management/models"

	"github.com/gin-gonic/gin"
)

func CreateStudent(c *gin.Context) {
	fmt.Println("v2 接收到创建学生请求")

	var student models.Student
	if err := c.ShouldBindJSON(&student); err != nil {
		fmt.Printf("v2 创建学生失败，数据绑定错误: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误", "detail": err.Error()})
		return
	}

	_, err := db.SQLiteDB.Exec("INSERT INTO students (id, name, age, grade) VALUES (?, ?, ?, ?)", student.ID, student.Name, student.Age, student.Grade)
	if err != nil {
		fmt.Printf("v2 创建学生失败，SQL 执行错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建学生信息失败", "detail": err.Error()})
		return
	}

	fmt.Printf("v2 创建学生成功: %+v\n", student)
	c.JSON(http.StatusCreated, gin.H{"message": "创建学生信息成功", "data": student})
}

func GetStudents(c *gin.Context) {
	fmt.Println("v2 接收到获取所有学生请求")

	rows, err := db.SQLiteDB.Query("SELECT id, name, age, grade, created_at, updated_at FROM students ORDER BY id")
	if err != nil {
		fmt.Printf("v2 获取学生列表失败，SQL 查询错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取学生列表失败", "detail": err.Error()})
		return
	}
	defer rows.Close()

	students := make([]models.Student, 0)
	for rows.Next() {
		var student models.Student
		if err := rows.Scan(&student.ID, &student.Name, &student.Age, &student.Grade, &student.CreatedAt, &student.UpdatedAt); err != nil {
			fmt.Printf("v2 读取学生列表失败，数据扫描错误: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "读取学生列表失败", "detail": err.Error()})
			return
		}
		students = append(students, student)
	}

	if err := rows.Err(); err != nil {
		fmt.Printf("v2 读取学生列表失败: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "读取学生列表失败", "detail": err.Error()})
		return
	}

	fmt.Printf("v2 返回学生列表，数量: %d\n", len(students))
	c.JSON(http.StatusOK, gin.H{"data": students})
}

func GetStudentByID(c *gin.Context) {
	fmt.Println("v2 接收到获取单个学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	student, found, err := findStudentByID(id)
	if err != nil {
		fmt.Printf("v2 获取学生失败，SQL 查询错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取学生信息失败", "detail": err.Error()})
		return
	}
	if !found {
		fmt.Printf("v2 获取学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	fmt.Printf("v2 获取学生成功: %+v\n", student)
	c.JSON(http.StatusOK, gin.H{"data": student})
}

func UpdateStudent(c *gin.Context) {
	fmt.Println("v2 接收到更新学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	var req models.UpdateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("v2 更新学生失败，数据绑定错误: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误", "detail": err.Error()})
		return
	}

	result, err := db.SQLiteDB.Exec("UPDATE students SET name = ?, age = ?, grade = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", req.Name, req.Age, req.Grade, id)
	if err != nil {
		fmt.Printf("v2 更新学生失败，SQL 执行错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新学生信息失败", "detail": err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		fmt.Printf("v2 获取更新结果失败: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取更新结果失败", "detail": err.Error()})
		return
	}
	if rowsAffected == 0 {
		fmt.Printf("v2 更新学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	student, _, _ := findStudentByID(id)
	fmt.Printf("v2 更新学生成功: %+v\n", student)
	c.JSON(http.StatusOK, gin.H{"message": "更新学生信息成功", "data": student})
}

func DeleteStudent(c *gin.Context) {
	fmt.Println("v2 接收到删除学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	result, err := db.SQLiteDB.Exec("DELETE FROM students WHERE id = ?", id)
	if err != nil {
		fmt.Printf("v2 删除学生失败，SQL 执行错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除学生信息失败", "detail": err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		fmt.Printf("v2 获取删除结果失败: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取删除结果失败", "detail": err.Error()})
		return
	}
	if rowsAffected == 0 {
		fmt.Printf("v2 删除学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	fmt.Printf("v2 删除学生成功，ID: %d\n", id)
	c.JSON(http.StatusOK, gin.H{"message": "删除学生信息成功"})
}

func parseStudentID(c *gin.Context) (int, bool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		fmt.Printf("v2 请求失败，学生 ID 参数错误: %s\n", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "学生 id 必须是整数"})
		return 0, false
	}
	return id, true
}

func findStudentByID(id int) (models.Student, bool, error) {
	var student models.Student
	err := db.SQLiteDB.QueryRow("SELECT id, name, age, grade, created_at, updated_at FROM students WHERE id = ?", id).
		Scan(&student.ID, &student.Name, &student.Age, &student.Grade, &student.CreatedAt, &student.UpdatedAt)
	if err == sql.ErrNoRows {
		return models.Student{}, false, nil
	}
	if err != nil {
		return models.Student{}, false, err
	}
	return student, true, nil
}
