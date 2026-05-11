package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"ai-vocabulary/config"
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
}

type ChatChoice struct {
	Message ChatMessage `json:"message"`
}

type ChatResponse struct {
	Choices []ChatChoice `json:"choices"`
}

type WordResult struct {
	Definition string   `json:"definition"`
	Examples   []string `json:"examples"`
}

func QueryWord(word string, aiProvider string) (*WordResult, error) {
	model := "qwen-turbo"
	if aiProvider == "deepseek" {
		model = "deepseek-v3"
	}

	prompt := fmt.Sprintf(`请为英语单词 "%s" 提供以下信息，必须以JSON格式返回（不要包含markdown代码块标记）：
{
  "definition": "该单词的中文释义，包含词性和常见含义",
  "examples": ["例句1（附中文翻译）", "例句2（附中文翻译）", "例句3（附中文翻译）"]
}
请确保返回严格的JSON格式，不要有其他多余文字。`, word)

	reqBody := ChatRequest{
		Model: model,
		Messages: []ChatMessage{
			{Role: "system", Content: "你是一个专业的英语词典助手，只返回JSON格式数据。"},
			{Role: "user", Content: prompt},
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", config.AppConfig.AIBaseURL+"/chat/completions", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.AppConfig.AIApiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return nil, fmt.Errorf("no choices returned from AI")
	}

	content := chatResp.Choices[0].Message.Content

	var result WordResult
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		cleanContent := cleanJSONContent(content)
		if err2 := json.Unmarshal([]byte(cleanContent), &result); err2 != nil {
			return nil, fmt.Errorf("parse AI response: %w, raw: %s", err2, content)
		}
	}

	if len(result.Examples) > 3 {
		result.Examples = result.Examples[:3]
	}

	return &result, nil
}

func cleanJSONContent(s string) string {
	start := -1
	end := -1
	for i, c := range s {
		if c == '{' {
			start = i
			break
		}
	}
	for i := len(s) - 1; i >= 0; i-- {
		if s[i] == '}' {
			end = i
			break
		}
	}
	if start >= 0 && end > start {
		return s[start : end+1]
	}
	return s
}
