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

// QueryWordRequest 是“查询单词”接口的参数。
type QueryWordRequest struct {
	Word       string `json:"word" binding:"required"`
	AIProvider string `json:"ai_provider"`
}

// SaveWordRequest 是“保存单词”接口的参数。
type SaveWordRequest struct {
	Word       string   `json:"word" binding:"required"`
	Definition string   `json:"definition" binding:"required"`
	Examples   []string `json:"examples" binding:"required"`
	AIProvider string   `json:"ai_provider"`
}

// normalizeAIProvider 统一 AI 提供商参数，默认使用 qwen。
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

// QueryWord 先检查当前用户是否已保存过该单词；
// 如果保存过，直接返回数据库里的结果；否则调用 AI 查询。
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

	// 从 JWT 中间件放入上下文的 user_id 里取当前用户 ID。
	userID := c.GetUint("user_id")

	// 先查数据库，看这个用户是否已经保存过该词。
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

	// 如果数据库里没有，就调用 AI 服务生成释义和例句。
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

// SaveWord 将单词保存到当前用户的词库中。
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

	// examples 是数组，入库前先序列化成 JSON 字符串。
	examplesJSON, err := json.Marshal(req.Examples)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "invalid examples"})
		return
	}

	// 允许“软删除后恢复”：如果曾经保存过同一个词，则先检查是否已经被删掉。
	var existingWord model.Word
	err = model.DB.Unscoped().Where("user_id = ? AND word = ?", userID, req.Word).First(&existingWord).Error
	if err == nil {
		if existingWord.DeletedAt.Valid {
			// 已软删除的单词，恢复时更新内容并清空 deleted_at。
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

		// 没删过且已存在，则直接返回冲突。
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

// GetWords 返回当前用户的单词列表，支持分页。
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

// DeleteWord 删除当前用户自己的某个单词。
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
