package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
	AIApiKey   string
	AIBaseURL  string
}

// AppConfig 是全局配置对象，程序启动时由 Init() 统一加载。
var AppConfig *Config

// Init 从 .env 文件和环境变量中读取配置，并保存到 AppConfig 中。
func Init() {
	// 指定配置文件路径为当前目录下的 .env。
	viper.SetConfigFile(".env")
	// 允许从系统环境变量中读取配置，便于 Docker 或部署环境覆盖。
	viper.AutomaticEnv()

	// 读取失败时这里不直接返回错误，项目会继续尝试从环境变量获取。
	_ = viper.ReadInConfig()

	AppConfig = &Config{
		DBHost:     viper.GetString("DB_HOST"),
		DBPort:     viper.GetString("DB_PORT"),
		DBUser:     viper.GetString("DB_USER"),
		DBPassword: viper.GetString("DB_PASSWORD"),
		DBName:     viper.GetString("DB_NAME"),
		JWTSecret:  viper.GetString("JWT_SECRET"),
		AIApiKey:   viper.GetString("AI_API_KEY"),
		AIBaseURL:  viper.GetString("AI_BASE_URL"),
	}
}

// GetDSN 拼出 MySQL 连接字符串，供数据库初始化时使用。
func GetDSN() string {
	return AppConfig.DBUser + ":" + AppConfig.DBPassword +
		"@tcp(" + AppConfig.DBHost + ":" + AppConfig.DBPort + ")/" +
		AppConfig.DBName + "?charset=utf8mb4&parseTime=True&loc=Local"
}
