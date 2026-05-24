package handlers

import (
	"net/http"

	"poster-server/models"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type AuthInput struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
}

func Register(c *gin.Context) {
	var input AuthInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名至少3个字符，密码至少6个字符"})
		return
	}

	var existingUser models.User
	if err := models.DB.Where("username = ?", input.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "用户名已存在"})
		return
	}

	user := models.User{Username: input.Username}
	if err := user.SetPassword(input.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败"})
		return
	}

	if err := models.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败"})
		return
	}

	session := sessions.Default(c)
	session.Set("user_id", user.ID)
	session.Save()

	c.JSON(http.StatusOK, gin.H{
		"message": "注册成功",
		"user":    user,
	})
}

func Login(c *gin.Context) {
	var input AuthInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请输入用户名和密码"})
		return
	}

	var user models.User
	if err := models.DB.Where("username = ?", input.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	if !user.CheckPassword(input.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	session := sessions.Default(c)
	session.Set("user_id", user.ID)
	session.Save()

	c.JSON(http.StatusOK, gin.H{
		"message": "登录成功",
		"user":    user,
	})
}

func GetUser(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	var user models.User
	if err := models.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": user})
}

func Logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	session.Save()
	c.JSON(http.StatusOK, gin.H{"message": "已退出登录"})
}
