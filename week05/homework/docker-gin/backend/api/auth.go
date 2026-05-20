package api

import (
	"net/http"
	"time"

	"ai-vocabulary/config"
	"ai-vocabulary/model"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// RegisterRequest 是注册接口的请求参数。
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=32"`
	Password string `json:"password" binding:"required,min=6,max=64"`
}

// LoginRequest 是登录接口的请求参数。
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Register 负责创建新用户。
// 流程：校验参数 -> 检查用户名是否存在 -> 哈希密码 -> 写入 users 表。
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "invalid params: " + err.Error()})
		return
	}

	// 同一个用户名不能重复注册。
	var existing model.User
	if err := model.DB.Where("username = ?", req.Username).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"code": 409, "message": "username already exists"})
		return
	}

	// 密码不能明文存储，必须先做哈希。
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "internal error"})
		return
	}

	user := model.User{
		Username: req.Username,
		Password: string(hashed),
	}
	if err := model.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "failed to create user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "register success",
	})
}

// Login 负责校验账号密码，并在成功后签发 JWT token。
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "invalid params"})
		return
	}

	// 按用户名查找用户。
	var user model.User
	if err := model.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "invalid username or password"})
		return
	}

	// 使用 bcrypt 校验输入密码是否和数据库中的哈希密码一致。
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "invalid username or password"})
		return
	}

	// 登录成功后签发 JWT，后续请求会用这个 token 进行身份校验。
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenStr, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "login success",
		"data": gin.H{
			"token":    tokenStr,
			"username": user.Username,
		},
	})
}
