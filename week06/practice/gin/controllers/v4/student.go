package v4

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"student-management/db"
	"student-management/models"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

const cacheTTL = 5 * time.Minute

var ctx = context.Background()

func CreateStudent(c *gin.Context) {
	fmt.Println("v4 接收到创建学生请求")

	var student models.Student
	if err := c.ShouldBindJSON(&student); err != nil {
		fmt.Printf("v4 创建学生失败，数据绑定错误: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误", "detail": err.Error()})
		return
	}

	if err := db.MySQLDB.Create(&student).Error; err != nil {
		fmt.Printf("v4 创建学生失败，GORM 执行错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建学生信息失败", "detail": err.Error()})
		return
	}

	clearStudentCaches(student.ID)
	fmt.Printf("v4 创建学生成功: %+v\n", student)
	c.JSON(http.StatusCreated, gin.H{"message": "创建学生信息成功", "data": student})
}

func GetStudents(c *gin.Context) {
	fmt.Println("v4 接收到获取所有学生请求")

	cacheKey := studentsCacheKey()
	if cached, ok := getStudentsFromCache(cacheKey); ok {
		fmt.Println("v4 从 Redis 缓存返回学生列表")
		c.JSON(http.StatusOK, gin.H{"data": cached})
		return
	}

	students := make([]models.Student, 0)
	if err := db.MySQLDB.Order("id ASC").Find(&students).Error; err != nil {
		fmt.Printf("v4 获取学生列表失败，GORM 查询错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取学生列表失败", "detail": err.Error()})
		return
	}

	setCache(cacheKey, students)
	fmt.Printf("v4 从 MySQL 返回学生列表，数量: %d\n", len(students))
	c.JSON(http.StatusOK, gin.H{"data": students})
}

func GetStudentByID(c *gin.Context) {
	fmt.Println("v4 接收到获取单个学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	cacheKey := studentCacheKey(id)
	if cached, ok := getStudentFromCache(cacheKey); ok {
		fmt.Printf("v4 从 Redis 缓存返回学生: %+v\n", cached)
		c.JSON(http.StatusOK, gin.H{"data": cached})
		return
	}

	student, found, err := findStudentByID(id)
	if err != nil {
		fmt.Printf("v4 获取学生失败，GORM 查询错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取学生信息失败", "detail": err.Error()})
		return
	}
	if !found {
		fmt.Printf("v4 获取学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	setCache(cacheKey, student)
	fmt.Printf("v4 从 MySQL 获取学生成功: %+v\n", student)
	c.JSON(http.StatusOK, gin.H{"data": student})
}

func UpdateStudent(c *gin.Context) {
	fmt.Println("v4 接收到更新学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	var req models.UpdateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("v4 更新学生失败，数据绑定错误: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误", "detail": err.Error()})
		return
	}

	student, found, err := findStudentByID(id)
	if err != nil {
		fmt.Printf("v4 更新学生失败，GORM 查询错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询学生信息失败", "detail": err.Error()})
		return
	}
	if !found {
		fmt.Printf("v4 更新学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	student.Name = req.Name
	student.Age = req.Age
	student.Grade = req.Grade
	if err := db.MySQLDB.Save(&student).Error; err != nil {
		fmt.Printf("v4 更新学生失败，GORM 执行错误: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新学生信息失败", "detail": err.Error()})
		return
	}

	clearStudentCaches(id)
	fmt.Printf("v4 更新学生成功并清理缓存: %+v\n", student)
	c.JSON(http.StatusOK, gin.H{"message": "更新学生信息成功", "data": student})
}

func DeleteStudent(c *gin.Context) {
	fmt.Println("v4 接收到删除学生请求")

	id, ok := parseStudentID(c)
	if !ok {
		return
	}

	result := db.MySQLDB.Delete(&models.Student{}, id)
	if result.Error != nil {
		fmt.Printf("v4 删除学生失败，GORM 执行错误: %v\n", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除学生信息失败", "detail": result.Error.Error()})
		return
	}
	if result.RowsAffected == 0 {
		fmt.Printf("v4 删除学生失败，未找到 ID: %d\n", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定 id 的学生信息"})
		return
	}

	clearStudentCaches(id)
	fmt.Printf("v4 删除学生成功并清理缓存，ID: %d\n", id)
	c.JSON(http.StatusOK, gin.H{"message": "删除学生信息成功"})
}

func parseStudentID(c *gin.Context) (int, bool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		fmt.Printf("v4 请求失败，学生 ID 参数错误: %s\n", c.Param("id"))
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

func getStudentFromCache(key string) (models.Student, bool) {
	value, err := db.RedisClient.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return models.Student{}, false
	}
	if err != nil {
		fmt.Printf("v4 读取 Redis 缓存失败: %v\n", err)
		return models.Student{}, false
	}

	var student models.Student
	if err := json.Unmarshal([]byte(value), &student); err != nil {
		fmt.Printf("v4 解析 Redis 学生缓存失败: %v\n", err)
		return models.Student{}, false
	}
	return student, true
}

func getStudentsFromCache(key string) ([]models.Student, bool) {
	value, err := db.RedisClient.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return nil, false
	}
	if err != nil {
		fmt.Printf("v4 读取 Redis 缓存失败: %v\n", err)
		return nil, false
	}

	students := make([]models.Student, 0)
	if err := json.Unmarshal([]byte(value), &students); err != nil {
		fmt.Printf("v4 解析 Redis 学生列表缓存失败: %v\n", err)
		return nil, false
	}
	return students, true
}

func setCache(key string, value any) {
	payload, err := json.Marshal(value)
	if err != nil {
		fmt.Printf("v4 序列化缓存数据失败: %v\n", err)
		return
	}

	if err := db.RedisClient.Set(ctx, key, payload, cacheTTL).Err(); err != nil {
		fmt.Printf("v4 写入 Redis 缓存失败: %v\n", err)
		return
	}
	fmt.Printf("v4 写入 Redis 缓存成功，key: %s\n", key)
}

func clearStudentCaches(id int) {
	keys := []string{studentsCacheKey(), studentCacheKey(id)}
	if err := db.RedisClient.Del(ctx, keys...).Err(); err != nil {
		fmt.Printf("v4 清理 Redis 缓存失败: %v\n", err)
		return
	}
	fmt.Printf("v4 清理 Redis 缓存成功，keys: %v\n", keys)
}

func studentsCacheKey() string {
	return "v4:students:all"
}

func studentCacheKey(id int) string {
	return fmt.Sprintf("v4:students:%d", id)
}
