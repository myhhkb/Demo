package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"ai-vocabulary/model"
	"ai-vocabulary/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type QueryWordRequest struct {
	Word       string `json:"word" binding:"required"`
	AIProvider string `json:"ai_provider"`
}

type SaveWordRequest struct {
	Word       string   `json:"word" binding:"required"`
	Definition string   `json:"definition" binding:"required"`
	Examples   []string `json:"examples" binding:"required"`
	AIProvider string   `json:"ai_provider"`
}

func normalizeAIProvider(provider string) (string, bool) {
	provider = strings.TrimSpace(provider)
	if provider == "" {
		return "qwen", true
	}
	if provider == "qwen" || provider == "deepseek" {
		return provider, true
	}
	return "", false
}

func QueryWord(c *gin.Context) {
	var req QueryWordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "invalid params: " + err.Error()})
		return
	}

	req.Word = strings.TrimSpace(req.Word)
	if req.Word == "" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "word cannot be empty"})
		return
	}

	provider, ok := normalizeAIProvider(req.AIProvider)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "ai_provider must be qwen or deepseek"})
		return
	}
	req.AIProvider = provider

	userID := c.GetUint("user_id")

	var existingWord model.Word
	err := model.DB.Where("user_id = ? AND word = ?", userID, req.Word).First(&existingWord).Error
	if err == nil {
		c.JSON(http.StatusOK, gin.H{
			"code":    200,
			"message": "word found in your vocabulary",
			"data": gin.H{
				"word":        existingWord.Word,
				"definition":  existingWord.Definition,
				"examples":    json.RawMessage(existingWord.Examples),
				"ai_provider": existingWord.AIProvider,
				"saved":       true,
			},
		})
		return
	}

	result, err := service.QueryWord(req.Word, req.AIProvider)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "AI query failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data": gin.H{
			"word":        req.Word,
			"definition":  result.Definition,
			"examples":    result.Examples,
			"ai_provider": req.AIProvider,
			"saved":       false,
		},
	})
}

func SaveWord(c *gin.Context) {
	var req SaveWordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "invalid params: " + err.Error()})
		return
	}

	req.Word = strings.TrimSpace(req.Word)
	if req.Word == "" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "word cannot be empty"})
		return
	}
	if len(req.Examples) != 3 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "examples must contain exactly 3 items"})
		return
	}

	provider, ok := normalizeAIProvider(req.AIProvider)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "ai_provider must be qwen or deepseek"})
		return
	}
	req.AIProvider = provider

	userID := c.GetUint("user_id")

	examplesJSON, err := json.Marshal(req.Examples)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "invalid examples"})
		return
	}

	var existingWord model.Word
	err = model.DB.Unscoped().Where("user_id = ? AND word = ?", userID, req.Word).First(&existingWord).Error
	if err == nil {
		if existingWord.DeletedAt.Valid {
			if err := model.DB.Unscoped().Model(&existingWord).Updates(map[string]interface{}{
				"definition":  req.Definition,
				"examples":    string(examplesJSON),
				"ai_provider": req.AIProvider,
				"deleted_at":  nil,
			}).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "failed to restore word"})
				return
			}
			model.DB.Where("id = ?", existingWord.ID).First(&existingWord)
			c.JSON(http.StatusOK, gin.H{
				"code":    200,
				"message": "word saved",
				"data":    existingWord,
			})
			return
		}

		c.JSON(http.StatusConflict, gin.H{"code": 409, "message": "word already exists in your vocabulary"})
		return
	}
	if err != nil && err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "failed to check existing word"})
		return
	}

	word := model.Word{
		UserID:     userID,
		Word:       req.Word,
		Definition: req.Definition,
		Examples:   string(examplesJSON),
		AIProvider: req.AIProvider,
	}

	if err := model.DB.Create(&word).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "failed to save word"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "word saved",
		"data":    word,
	})
}

func GetWords(c *gin.Context) {
	userID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	var total int64
	model.DB.Model(&model.Word{}).Where("user_id = ?", userID).Count(&total)

	var words []model.Word
	offset := (page - 1) * pageSize
	model.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&words)

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data": gin.H{
			"list":      words,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func DeleteWord(c *gin.Context) {
	userID := c.GetUint("user_id")
	wordID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "invalid word id"})
		return
	}

	result := model.DB.Where("id = ? AND user_id = ?", wordID, userID).Delete(&model.Word{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "word not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "word deleted",
	})
}
