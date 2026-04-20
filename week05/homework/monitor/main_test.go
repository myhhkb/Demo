package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestDetectProtocol(t *testing.T) {
	tests := []struct {
		name    string
		address string
		want    string
	}{
		{name: "http", address: "https://example.com", want: "http"},
		{name: "tcp", address: "localhost:3306", want: "tcp"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := DetectProtocol(tt.address)
			if got != tt.want {
				t.Fatalf("DetectProtocol(%q) = %q, want %q", tt.address, got, tt.want)
			}
		})
	}
}

func TestLoadConfig(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "config.json")
	content := `{
  "targets": [
    {
      "name": "Example",
      "address": "https://example.com",
      "retry_count": 2
    },
    {
      "name": "MySQL",
      "address": "localhost:3306",
      "protocol": "tcp"
    }
  ]
}`

	if err := os.WriteFile(configPath, []byte(content), 0644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	config, err := LoadConfig(configPath)
	if err != nil {
		t.Fatalf("LoadConfig() error = %v", err)
	}

	if len(config.Targets) != 2 {
		t.Fatalf("len(Targets) = %d, want 2", len(config.Targets))
	}

	if config.Targets[0].Protocol != "http" {
		t.Fatalf("first protocol = %q, want http", config.Targets[0].Protocol)
	}
	if config.Targets[0].ExpectedStatus != 200 {
		t.Fatalf("first expected status = %d, want 200", config.Targets[0].ExpectedStatus)
	}
	if config.Targets[0].RetryCount != 2 {
		t.Fatalf("first retry count = %d, want 2", config.Targets[0].RetryCount)
	}
}

func TestLoadConfigRejectsRetryGreaterThanThree(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "config.json")
	content := `{
  "targets": [
    {
      "name": "Example",
      "address": "https://example.com",
      "retry_count": 4
    }
  ]
}`

	if err := os.WriteFile(configPath, []byte(content), 0644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	_, err := LoadConfig(configPath)
	if err == nil {
		t.Fatal("LoadConfig() error = nil, want non-nil")
	}
}

func TestCheckWithRetryStopsAfterSuccess(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("Go monitor"))
	}))
	defer server.Close()

	target := Target{
		Name:           "example",
		Address:        server.URL,
		Protocol:       "http",
		ExpectedStatus: 200,
		ExpectedBody:   "Go",
		RetryCount:     2,
	}

	got := CheckWithRetry(target, 2*time.Second)
	if !got.Success {
		t.Fatalf("CheckWithRetry() success = false, want true, message = %s", got.Message)
	}
	if got.Attempts != 1 {
		t.Fatalf("attempts = %d, want 1", got.Attempts)
	}
}

func TestBuildSummary(t *testing.T) {
	results := []Result{
		{Name: "fast", Success: true, Duration: 100 * time.Millisecond},
		{Name: "mid", Success: true, Duration: 800 * time.Millisecond},
		{Name: "slow", Success: true, Duration: 3 * time.Second},
		{Name: "fail", Success: false, Duration: 2 * time.Second},
	}

	summary := BuildSummary(results)
	if summary.Total != 4 {
		t.Fatalf("summary total = %d, want 4", summary.Total)
	}
	if summary.Success != 3 {
		t.Fatalf("summary success = %d, want 3", summary.Success)
	}
	if summary.Failed != 1 {
		t.Fatalf("summary failed = %d, want 1", summary.Failed)
	}
	if summary.Fastest.Name != "fast" {
		t.Fatalf("fastest = %s, want fast", summary.Fastest.Name)
	}
	if summary.Slowest.Name != "slow" {
		t.Fatalf("slowest = %s, want slow", summary.Slowest.Name)
	}
	if summary.ResponseLevels["快"] != 1 || summary.ResponseLevels["中"] != 1 || summary.ResponseLevels["慢"] != 1 {
		t.Fatalf("unexpected response levels = %#v", summary.ResponseLevels)
	}
}

func TestBuildReport(t *testing.T) {
	results := []Result{
		{Name: "百度", Address: "https://example.com", Protocol: "http", Success: true, Duration: 120 * time.Millisecond, Attempts: 1, Message: "OK"},
	}
	summary := BuildSummary(results)
	report := BuildReport(results, summary)

	checks := []string{"服务健康探测报告", "成功率", "[01] 百度", "协议     : HTTP", "结果     : 成功"}
	for _, check := range checks {
		if !strings.Contains(report, check) {
			t.Fatalf("report does not contain %q", check)
		}
	}
}

func TestSaveReport(t *testing.T) {
	tempDir := t.TempDir()
	oldWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Getwd() error = %v", err)
	}
	defer os.Chdir(oldWd)

	if err := os.Chdir(tempDir); err != nil {
		t.Fatalf("Chdir() error = %v", err)
	}

	fileName, err := SaveReport("hello", time.Date(2026, 3, 25, 16, 40, 40, 0, time.Local))
	if err != nil {
		t.Fatalf("SaveReport() error = %v", err)
	}
	if fileName != "monitor-log-20260325164040.log" {
		t.Fatalf("fileName = %q, want monitor-log-20260325164040.log", fileName)
	}

	content, err := os.ReadFile(filepath.Join(tempDir, fileName))
	if err != nil {
		t.Fatalf("ReadFile() error = %v", err)
	}
	if string(content) != "hello" {
		t.Fatalf("file content = %q, want hello", string(content))
	}
}
