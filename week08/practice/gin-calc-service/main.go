package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type app struct {
	resultDir string
	reportURL string
	client    *http.Client
}

type calcResponse struct {
	ReqStart   int64             `json:"req_start"`
	ReqEnd     int64             `json:"req_end"`
	Details    map[string]string  `json:"details"`
	SumList    string            `json:"sum_list"`
	TotalCount int               `json:"total_count"`
	ResultFile string            `json:"result_file"`
}

type reportPayload struct {
	Username   string `json:"username"`
	UUID       string `json:"uuid"`
	ReqStart   int64  `json:"req_start"`
	ReqEnd     int64  `json:"req_end"`
	Details    string `json:"details"`
	SumList    string `json:"sum_list"`
	TotalCount int    `json:"total_count"`
	MD5        string `json:"md5"`
}

type fileResult struct {
	name     string
	details  string
	sum      int64
	count    int
	content  string
}

func main() {
	_ = os.MkdirAll("results", 0755)
	app := &app{
		resultDir: "results",
		reportURL: strings.TrimSpace(os.Getenv("REPORT_URL")),
		client:    &http.Client{Timeout: 5 * time.Second},
	}

	r := gin.Default()
	r.POST("/api/calculate", app.handleCalculate)
	r.GET("/api/result/list", app.handleList)
	r.GET("/api/result/detail", app.handleDetail)
	_ = r.Run(":8080")
}

func (a *app) handleCalculate(c *gin.Context) {
	username := strings.TrimSpace(c.PostForm("username"))
	uuid := strings.TrimSpace(c.PostForm("uuid"))
	if username == "" || uuid == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and uuid are required"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil || len(form.File["files"]) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no files uploaded"})
		return
	}

	reqStart := time.Now().UnixMilli()
	results, totalCount, err := a.processFiles(form.File["files"])
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	reqEnd := time.Now().UnixMilli()

	keys := make([]string, 0, len(results))
	for k := range results {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	details := make(map[string]string, len(results))
	for _, k := range keys {
		details[k] = results[k].details
	}
	sumList := make([]string, 0, len(keys))
	for _, k := range keys {
		sumList = append(sumList, strconv.FormatInt(results[k].sum, 10))
	}
	sumListStr := strings.Join(sumList, ",")

	detailJSON, _ := json.Marshal(details)
	md5Hex := md5String(detailJSON)
	resultFile := fmt.Sprintf("result_%d.txt", reqStart)
	if err := os.WriteFile(filepath.Join(a.resultDir, resultFile), []byte(buildResultFileContent(keys, results)), 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save result file"})
		return
	}

	go a.report(username, uuid, reqStart, reqEnd, string(detailJSON), sumListStr, totalCount, md5Hex)

	c.JSON(http.StatusOK, calcResponse{
		ReqStart:   reqStart,
		ReqEnd:     reqEnd,
		Details:    details,
		SumList:    sumListStr,
		TotalCount: totalCount,
		ResultFile: resultFile,
	})
}

func (a *app) processFiles(files []*multipart.FileHeader) (map[string]fileResult, int, error) {
	results := make(map[string]fileResult, len(files))
	var mu sync.Mutex
	var wg sync.WaitGroup
	var firstErr error
	var errMu sync.Mutex

	for _, fh := range files {
		fh := fh
		wg.Add(1)
		go func() {
			defer wg.Done()
			parsed, err := parseExpressionFile(fh)
			if err != nil {
				errMu.Lock()
				if firstErr == nil {
					firstErr = fmt.Errorf("invalid expression in file: %s", fh.Filename)
				}
				errMu.Unlock()
				return
			}
			mu.Lock()
			results[fh.Filename] = parsed
			mu.Unlock()
		}()
	}
	wg.Wait()

	if firstErr != nil {
		return nil, 0, firstErr
	}

	totalCount := 0
	for _, r := range results {
		totalCount += r.count
	}
	return results, totalCount, nil
}

func parseExpressionFile(fh *multipart.FileHeader) (fileResult, error) {
	f, err := fh.Open()
	if err != nil {
		return fileResult{}, err
	}
	defer f.Close()

	data, err := io.ReadAll(f)
	if err != nil {
		return fileResult{}, err
	}
	lines := strings.Split(strings.ReplaceAll(string(data), "\r\n", "\n"), "\n")
	results := make([]string, 0, len(lines))
	sum := int64(0)
	count := 0
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		v, err := evalLine(line)
		if err != nil {
			return fileResult{}, err
		}
		results = append(results, fmt.Sprintf("%s=%d", line, v))
		sum += v
		count++
	}
	return fileResult{name: fh.Filename, details: strings.Join(results, ","), sum: sum, count: count, content: strings.Join(results, "\n")}, nil
}

func evalLine(expr string) (int64, error) {
	for _, op := range []string{"+", "-", "*"} {
		if idx := strings.Index(expr, op); idx > 0 {
			left := strings.TrimSpace(expr[:idx])
			right := strings.TrimSpace(expr[idx+1:])
			a, err := strconv.ParseInt(left, 10, 64)
			if err != nil {
				return 0, err
			}
			b, err := strconv.ParseInt(right, 10, 64)
			if err != nil {
				return 0, err
			}
			switch op {
			case "+": return a + b, nil
			case "-": return a - b, nil
			case "*": return a * b, nil
			}
		}
	}
	return 0, fmt.Errorf("invalid expression")
}

func buildResultFileContent(keys []string, results map[string]fileResult) string {
	var lines []string
	for _, k := range keys {
		if results[k].content == "" { continue }
		lines = append(lines, strings.Split(results[k].content, "\n")...)
	}
	return strings.Join(lines, "\n")
}

func (a *app) handleList(c *gin.Context) {
	entries, err := os.ReadDir(a.resultDir)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"files": []string{}})
		return
	}
	files := make([]string, 0)
	for _, e := range entries {
		if !e.IsDir() && strings.HasPrefix(e.Name(), "result_") && strings.HasSuffix(e.Name(), ".txt") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)
	c.JSON(http.StatusOK, gin.H{"files": files})
}

func (a *app) handleDetail(c *gin.Context) {
	fileid := strings.TrimSpace(c.Query("fileid"))
	if fileid == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "fileid is required"})
		return
	}
	path := filepath.Join(a.resultDir, filepath.Base(fileid))
	if _, err := os.Stat(path); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}
	if c.Query("download") == "1" {
		c.FileAttachment(path, filepath.Base(path))
		return
	}
	c.File(path)
}

func (a *app) report(username, uuid string, reqStart, reqEnd int64, details, sumList string, totalCount int, md5Hex string) {
	if a.reportURL == "" {
		return
	}
	payload := reportPayload{
		Username:   username,
		UUID:       uuid,
		ReqStart:   reqStart,
		ReqEnd:     reqEnd,
		Details:    details,
		SumList:    sumList,
		TotalCount: totalCount,
		MD5:        md5Hex,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return
	}
	req, err := http.NewRequest(http.MethodPost, a.reportURL, strings.NewReader(string(body)))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := a.client.Do(req)
	if resp != nil {
		defer resp.Body.Close()
	}
	_ = err
}

func md5String(b []byte) string {
	h := md5.Sum(b)
	return hex.EncodeToString(h[:])
}
