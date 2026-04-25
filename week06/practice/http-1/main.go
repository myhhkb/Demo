package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type Todo struct {
	UserID    int    `json:"userId"`
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
}

func main() {
	client := http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get("https://jsonplaceholder.typicode.com/todos")
	if err != nil {
		log.Fatalf("发送请求失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Fatalf("请求失败，状态码: %d", resp.StatusCode)
	}

	var todos []Todo
	if err := json.NewDecoder(resp.Body).Decode(&todos); err != nil {
		log.Fatalf("解析响应失败: %v", err)
	}

	for _, todo := range todos {
		fmt.Printf("title: %s, userId: %d, id: %d, completed: %t\n", todo.Title, todo.UserID, todo.ID, todo.Completed)
	}
}
