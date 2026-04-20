package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"sort"
	"strings"
	"sync"
	"time"
)

const (
	defaultConfigPath = "config.json"
	defaultTimeoutSec = 3
	maxRetryCount     = 3
)

type Config struct {
	Targets []Target `json:"targets"`
}

type Target struct {
	Name           string `json:"name"`
	Address        string `json:"address"`
	Protocol       string `json:"protocol"`
	ExpectedStatus int    `json:"expected_status,omitempty"`
	ExpectedBody   string `json:"expected_body,omitempty"`
	RetryCount     int    `json:"retry_count,omitempty"`
}

type Result struct {
	Name      string
	Address   string
	Protocol  string
	Success   bool
	Message   string
	Duration  time.Duration
	Attempts  int
	CheckedAt time.Time
}

type Summary struct {
	Total          int
	Success        int
	Failed         int
	SuccessRate    float64
	Fastest        Result
	Slowest        Result
	ResponseLevels map[string]int
}

func main() {
	configPath, timeout, verbose := parseFlags(os.Args[1:])

	config, err := LoadConfig(configPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "读取配置失败: %v\n", err)
		os.Exit(1)
	}

	results := RunChecks(config.Targets, timeout, verbose, os.Stdout)
	summary := BuildSummary(results)
	report := BuildReport(results, summary)

	fmt.Println()
	fmt.Print(report)

	logPath, err := SaveReport(report, time.Now())
	if err != nil {
		fmt.Fprintf(os.Stderr, "保存报告失败: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("\n报告已生成: %s\n", logPath)

	if summary.Failed > 0 {
		os.Exit(1)
	}
}

func parseFlags(args []string) (string, time.Duration, bool) {
	fs := flag.NewFlagSet("monitor", flag.ExitOnError)
	configPath := fs.String("config", defaultConfigPath, "配置文件路径")
	timeoutSec := fs.Int("timeout", defaultTimeoutSec, "单个探测超时时间，单位为秒")
	verbose := fs.Bool("v", false, "开启详细模式，实时打印每个目标的探测状态")
	fs.Parse(args)

	if *timeoutSec <= 0 {
		*timeoutSec = defaultTimeoutSec
	}

	return *configPath, time.Duration(*timeoutSec) * time.Second, *verbose
}

func LoadConfig(path string) (Config, error) {
	file, err := os.Open(path)
	if err != nil {
		return Config{}, err
	}
	defer file.Close()

	var config Config
	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&config); err != nil {
		return Config{}, err
	}

	if len(config.Targets) == 0 {
		return Config{}, errors.New("配置文件中至少需要一个 targets")
	}

	for i := range config.Targets {
		target := &config.Targets[i]
		target.Protocol = strings.ToLower(strings.TrimSpace(target.Protocol))
		target.Name = strings.TrimSpace(target.Name)
		target.Address = strings.TrimSpace(target.Address)

		if target.Name == "" {
			return Config{}, fmt.Errorf("第 %d 个目标缺少 name", i+1)
		}
		if target.Address == "" {
			return Config{}, fmt.Errorf("目标 %s 缺少 address", target.Name)
		}
		if target.Protocol == "" {
			target.Protocol = DetectProtocol(target.Address)
		}
		if target.Protocol != "http" && target.Protocol != "tcp" {
			return Config{}, fmt.Errorf("目标 %s 的 protocol 只支持 http 或 tcp", target.Name)
		}
		if target.RetryCount < 0 {
			return Config{}, fmt.Errorf("目标 %s 的 retry_count 不能小于 0", target.Name)
		}
		if target.RetryCount > maxRetryCount {
			return Config{}, fmt.Errorf("目标 %s 的 retry_count 不能大于 %d", target.Name, maxRetryCount)
		}
		if target.Protocol == "http" && target.ExpectedStatus == 0 {
			target.ExpectedStatus = http.StatusOK
		}
	}

	return config, nil
}

func DetectProtocol(address string) string {
	lower := strings.ToLower(address)
	if strings.HasPrefix(lower, "http://") || strings.HasPrefix(lower, "https://") {
		return "http"
	}
	return "tcp"
}

func RunChecks(targets []Target, timeout time.Duration, verbose bool, writer io.Writer) []Result {
	results := make([]Result, 0, len(targets))
	resultCh := make(chan Result, len(targets))
	var wg sync.WaitGroup

	start := time.Now()
	for _, target := range targets {
		wg.Add(1)
		go func(t Target) {
			defer wg.Done()
			result := CheckWithRetry(t, timeout)
			if verbose {
				status := "失败"
				if result.Success {
					status = "成功"
				}
				fmt.Fprintf(writer, "[%s] %s %s，用时 %s，尝试 %d 次，结果: %s\n", status, result.Name, result.Address, FormatDuration(result.Duration), result.Attempts, result.Message)
			}
			resultCh <- result
		}(target)
	}

	wg.Wait()
	close(resultCh)

	for result := range resultCh {
		results = append(results, result)
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Name < results[j].Name
	})

	if verbose {
		fmt.Fprintf(writer, "全部探测任务完成，总耗时 %s\n", FormatDuration(time.Since(start)))
	}

	return results
}

func CheckWithRetry(target Target, timeout time.Duration) Result {
	maxAttempts := target.RetryCount + 1
	var last Result

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		last = CheckTarget(target, timeout)
		last.Attempts = attempt
		if last.Success {
			return last
		}
	}

	return last
}

func CheckTarget(target Target, timeout time.Duration) Result {
	start := time.Now()
	result := Result{
		Name:      target.Name,
		Address:   target.Address,
		Protocol:  target.Protocol,
		CheckedAt: start,
	}

	// 按作业要求保留 1 秒延时，便于演示并发扫描效果。
	time.Sleep(1 * time.Second)

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	var err error
	if target.Protocol == "http" {
		err = checkHTTP(ctx, target)
	} else {
		err = checkTCP(ctx, target)
	}

	result.Duration = time.Since(start)
	if err != nil {
		result.Success = false
		result.Message = err.Error()
		return result
	}

	result.Success = true
	result.Message = "OK"
	return result
}

func checkHTTP(ctx context.Context, target Target) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target.Address, nil)
	if err != nil {
		return err
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != target.ExpectedStatus {
		return fmt.Errorf("HTTP 状态码为 %d，期望 %d", resp.StatusCode, target.ExpectedStatus)
	}

	if target.ExpectedBody != "" {
		body, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
		if err != nil {
			return err
		}
		if !strings.Contains(string(body), target.ExpectedBody) {
			return fmt.Errorf("响应内容不包含 %q", target.ExpectedBody)
		}
	}

	return nil
}

func checkTCP(ctx context.Context, target Target) error {
	dialer := net.Dialer{}
	conn, err := dialer.DialContext(ctx, "tcp", target.Address)
	if err != nil {
		return err
	}
	return conn.Close()
}

func BuildSummary(results []Result) Summary {
	summary := Summary{
		Total:          len(results),
		ResponseLevels: map[string]int{"快": 0, "中": 0, "慢": 0},
	}

	var successful []Result
	for _, result := range results {
		if result.Success {
			summary.Success++
			successful = append(successful, result)
			summary.ResponseLevels[ResponseLevel(result.Duration)]++
		} else {
			summary.Failed++
		}
	}

	if summary.Total > 0 {
		summary.SuccessRate = float64(summary.Success) / float64(summary.Total) * 100
	}

	if len(successful) > 0 {
		summary.Fastest = successful[0]
		summary.Slowest = successful[0]
		for _, result := range successful[1:] {
			if result.Duration < summary.Fastest.Duration {
				summary.Fastest = result
			}
			if result.Duration > summary.Slowest.Duration {
				summary.Slowest = result
			}
		}
	}

	return summary
}

func ResponseLevel(duration time.Duration) string {
	if duration < 500*time.Millisecond {
		return "快"
	}
	if duration < 2*time.Second {
		return "中"
	}
	return "慢"
}

func BuildReport(results []Result, summary Summary) string {
	var builder strings.Builder

	builder.WriteString("服务健康探测报告\n")
	builder.WriteString(strings.Repeat("=", 48))
	builder.WriteString("\n\n")
	builder.WriteString(fmt.Sprintf("生成时间   : %s\n", time.Now().Format("2006-01-02 15:04:05")))
	builder.WriteString(fmt.Sprintf("探测总数   : %d\n", summary.Total))
	builder.WriteString(fmt.Sprintf("成功数量   : %d\n", summary.Success))
	builder.WriteString(fmt.Sprintf("失败数量   : %d\n", summary.Failed))
	builder.WriteString(fmt.Sprintf("成功率     : %.2f%%\n", summary.SuccessRate))
	builder.WriteString(fmt.Sprintf("响应分布   : 快=%d  中=%d  慢=%d\n", summary.ResponseLevels["快"], summary.ResponseLevels["中"], summary.ResponseLevels["慢"]))

	if summary.Success > 0 {
		builder.WriteString(fmt.Sprintf("最快服务   : %s (%s)\n", summary.Fastest.Name, FormatDuration(summary.Fastest.Duration)))
		builder.WriteString(fmt.Sprintf("最慢服务   : %s (%s)\n", summary.Slowest.Name, FormatDuration(summary.Slowest.Duration)))
	}

	builder.WriteString("\n探测明细\n")
	builder.WriteString(strings.Repeat("-", 48))
	builder.WriteString("\n")
	for i, result := range results {
		builder.WriteString(FormatResultBlock(i+1, result))
		if i < len(results)-1 {
			builder.WriteString(strings.Repeat("-", 48))
			builder.WriteString("\n")
		}
	}

	return builder.String()
}

func FormatResultBlock(index int, result Result) string {
	var builder strings.Builder

	builder.WriteString(fmt.Sprintf("[%02d] %s\n", index, result.Name))
	builder.WriteString(fmt.Sprintf("  协议     : %s\n", strings.ToUpper(result.Protocol)))
	builder.WriteString(fmt.Sprintf("  地址     : %s\n", result.Address))
	builder.WriteString(fmt.Sprintf("  结果     : %s\n", StatusText(result.Success)))
	builder.WriteString(fmt.Sprintf("  耗时     : %s\n", FormatDuration(result.Duration)))
	builder.WriteString(fmt.Sprintf("  尝试次数 : %d\n", result.Attempts))
	builder.WriteString(fmt.Sprintf("  说明     : %s\n", result.Message))

	return builder.String()
}

func StatusText(success bool) string {
	if success {
		return "成功"
	}
	return "失败"
}

func SaveReport(report string, now time.Time) (string, error) {
	fileName := fmt.Sprintf("monitor-log-%s.log", now.Format("20060102150405"))
	return fileName, os.WriteFile(fileName, []byte(report), 0644)
}

func FormatDuration(duration time.Duration) string {
	if duration < time.Second {
		return fmt.Sprintf("%dms", duration.Milliseconds())
	}
	return fmt.Sprintf("%.2fs", duration.Seconds())
}
