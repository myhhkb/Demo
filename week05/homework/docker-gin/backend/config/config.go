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

var AppConfig *Config

func Init() {
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()

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

func GetDSN() string {
	return AppConfig.DBUser + ":" + AppConfig.DBPassword +
		"@tcp(" + AppConfig.DBHost + ":" + AppConfig.DBPort + ")/" +
		AppConfig.DBName + "?charset=utf8mb4&parseTime=True&loc=Local"
}
