package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const todosURL = "https://jsonplaceholder.typicode.com/todos"

type Todo struct {
	UserID    int    `json:"userId"`
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
}

func main() {
	http.HandleFunc("/api/todo/list", todoListHandler)
	http.HandleFunc("/api/todo/detail/", todoDetailHandler)

	log.Println("http 服务已启动，监听端口: 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func todoListHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "只支持 GET 请求")
		return
	}

	todos, err := fetchTodos()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, todos)
}

func todoDetailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "只支持 GET 请求")
		return
	}

	idText := strings.TrimPrefix(r.URL.Path, "/api/todo/detail/")
	if idText == "" || strings.Contains(idText, "/") {
		writeError(w, http.StatusBadRequest, "todo id 不正确")
		return
	}

	id, err := strconv.Atoi(idText)
	if err != nil {
		writeError(w, http.StatusBadRequest, "todo id 必须是数字")
		return
	}

	todo, err := fetchTodoByID(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, todo)
}

func fetchTodos() ([]Todo, error) {
	client := http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(todosURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, &httpError{statusCode: resp.StatusCode}
	}

	var todos []Todo
	if err := json.NewDecoder(resp.Body).Decode(&todos); err != nil {
		return nil, err
	}

	return todos, nil
}

func fetchTodoByID(id int) (Todo, error) {
	client := http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(todosURL + "/" + strconv.Itoa(id))
	if err != nil {
		return Todo{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return Todo{}, &httpError{statusCode: resp.StatusCode}
	}

	var todo Todo
	if err := json.NewDecoder(resp.Body).Decode(&todo); err != nil {
		return Todo{}, err
	}

	return todo, nil
}

func writeJSON(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("写入响应失败: %v", err)
	}
}

func writeError(w http.ResponseWriter, statusCode int, message string) {
	writeJSON(w, statusCode, map[string]string{"error": message})
}

type httpError struct {
	statusCode int
}

func (e *httpError) Error() string {
	return "请求 todo 数据失败，状态码: " + strconv.Itoa(e.statusCode)
}
