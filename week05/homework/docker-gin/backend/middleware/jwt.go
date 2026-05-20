package middleware

import (
	"net/http"
	"strings"

	"ai-vocabulary/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTAuth 是一个 Gin 中间件，用来保护需要登录才能访问的接口。
// 它会从 Authorization 头里读取 Bearer token，验证成功后把用户信息放到上下文中。
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 读取请求头中的 token。
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "missing authorization header"})
			c.Abort()
			return
		}

		// 2. 校验格式必须是：Bearer xxx.xxx.xxx。
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "invalid authorization format"})
			c.Abort()
			return
		}

		// 3. 解析 token，并使用配置里的 JWTSecret 验签。
		tokenStr := parts[1]
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrTokenSignatureInvalid
			}
			return []byte(config.AppConfig.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "invalid or expired token"})
			c.Abort()
			return
		}

		// 4. 从 token claims 中取出用户信息，后续接口会直接使用。
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "invalid token claims"})
			c.Abort()
			return
		}

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok || userIDFloat <= 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "invalid token user_id"})
			c.Abort()
			return
		}

		username, ok := claims["username"].(string)
		if !ok || username == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "invalid token username"})
			c.Abort()
			return
		}

		// 5. 把用户信息放进上下文，供后续 handler 直接读取。
		c.Set("user_id", uint(userIDFloat))
		c.Set("username", username)
		c.Next()
	}
}
