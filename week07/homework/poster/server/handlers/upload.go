package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/gin-gonic/gin"
)

func GetUploadPolicy(c *gin.Context) {
	endpoint := os.Getenv("OSS_ENDPOINT")
	accessKeyId := os.Getenv("OSS_ACCESS_KEY_ID")
	accessKeySecret := os.Getenv("OSS_ACCESS_KEY_SECRET")
	bucketName := os.Getenv("OSS_BUCKET")

	if endpoint == "" || accessKeyId == "" || accessKeySecret == "" || bucketName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OSS未配置"})
		return
	}

	ext := c.Query("ext")
	if ext == "" {
		ext = ".png"
	}

	objectKey := fmt.Sprintf("poster/%d%s", time.Now().UnixNano(), ext)

	client, err := oss.New(endpoint, accessKeyId, accessKeySecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "OSS连接失败"})
		return
	}

	bucket, err := client.Bucket(bucketName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取Bucket失败"})
		return
	}

	signedURL, err := bucket.SignURL(objectKey, oss.HTTPPut, 300)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成上传签名失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"upload_url": signedURL,
		"object_key": objectKey,
	})
}

func GetSignedURL(c *gin.Context) {
	objectKey := c.Query("key")
	if objectKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少key参数"})
		return
	}

	endpoint := os.Getenv("OSS_ENDPOINT")
	accessKeyId := os.Getenv("OSS_ACCESS_KEY_ID")
	accessKeySecret := os.Getenv("OSS_ACCESS_KEY_SECRET")
	bucketName := os.Getenv("OSS_BUCKET")

	if endpoint == "" || accessKeyId == "" || accessKeySecret == "" || bucketName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OSS未配置"})
		return
	}

	client, err := oss.New(endpoint, accessKeyId, accessKeySecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "OSS连接失败"})
		return
	}

	bucket, err := client.Bucket(bucketName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取Bucket失败"})
		return
	}

	signedURL, err := bucket.SignURL(objectKey, oss.HTTPGet, 3600)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成读取签名失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": signedURL})
}

func UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请选择文件"})
		return
	}
	defer file.Close()

	ext := filepath.Ext(header.Filename)
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不支持的文件格式"})
		return
	}

	if header.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件大小不能超过10MB"})
		return
	}

	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	uploadPath := filepath.Join("uploads", filename)

	out, err := os.Create(uploadPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": "/uploads/" + filename})
}

type AIImageRequest struct {
	Prompt string `json:"prompt" binding:"required"`
}

func GenerateImage(c *gin.Context) {
	var req AIImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请输入图片描述"})
		return
	}

	apiKey := os.Getenv("DASHSCOPE_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI服务未配置"})
		return
	}

	requestBody := map[string]interface{}{
		"model": "wanx-v1",
		"input": map[string]interface{}{
			"prompt": req.Prompt,
		},
		"parameters": map[string]interface{}{
			"size":  "1024*1024",
			"n":     1,
			"style": "<auto>",
		},
	}

	jsonBody, _ := json.Marshal(requestBody)
	httpReq, _ := http.NewRequest("POST", "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", bytes.NewBuffer(jsonBody))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("X-DashScope-Async", "enable")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI服务请求失败"})
		return
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if output, ok := result["output"].(map[string]interface{}); ok {
		if taskId, ok := output["task_id"].(string); ok {
			for i := 0; i < 60; i++ {
				time.Sleep(2 * time.Second)
				statusReq, _ := http.NewRequest("GET", "https://dashscope.aliyuncs.com/api/v1/tasks/"+taskId, nil)
				statusReq.Header.Set("Authorization", "Bearer "+apiKey)
				statusResp, err := client.Do(statusReq)
				if err != nil {
					continue
				}

				var statusResult map[string]interface{}
				json.NewDecoder(statusResp.Body).Decode(&statusResult)
				statusResp.Body.Close()

				if output, ok := statusResult["output"].(map[string]interface{}); ok {
					if status, ok := output["task_status"].(string); ok {
						if status == "SUCCEEDED" {
							if results, ok := output["results"].([]interface{}); ok && len(results) > 0 {
								if first, ok := results[0].(map[string]interface{}); ok {
									if url, ok := first["url"].(string); ok {
										c.JSON(http.StatusOK, gin.H{"url": url})
										return
									}
								}
							}
						} else if status == "FAILED" {
							c.JSON(http.StatusInternalServerError, gin.H{"error": "AI生成失败"})
							return
						}
					}
				}
			}
		}
	}

	c.JSON(http.StatusInternalServerError, gin.H{"error": "AI生成超时"})
}
