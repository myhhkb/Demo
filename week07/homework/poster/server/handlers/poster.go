package handlers

import (
	"net/http"
	"strconv"

	"poster-server/models"

	"github.com/gin-gonic/gin"
)

type PosterInput struct {
	Title  string `json:"title"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Data   string `json:"data"`
}

func SavePoster(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	var input PosterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	var poster models.Poster
	idStr := c.Query("id")
	if idStr != "" {
		id, _ := strconv.ParseUint(idStr, 10, 32)
		models.DB.Where("id = ? AND user_id = ?", id, userID).First(&poster)
	}

	if poster.ID == 0 {
		poster = models.Poster{
			UserID: userID,
			Title:  input.Title,
			Width:  input.Width,
			Height: input.Height,
			Data:   input.Data,
		}
		models.DB.Create(&poster)
	} else {
		poster.Title = input.Title
		poster.Width = input.Width
		poster.Height = input.Height
		poster.Data = input.Data
		models.DB.Save(&poster)
	}

	c.JSON(http.StatusOK, gin.H{"poster": poster})
}

func GetPosters(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	var posters []models.Poster
	models.DB.Where("user_id = ?", userID).Order("updated_at desc").Find(&posters)
	c.JSON(http.StatusOK, gin.H{"posters": posters})
}

func GetPoster(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	id := c.Param("id")
	var poster models.Poster
	if err := models.DB.Where("id = ? AND user_id = ?", id, userID).First(&poster).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "海报不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"poster": poster})
}

func DeletePoster(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	id := c.Param("id")
	result := models.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Poster{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "海报不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
