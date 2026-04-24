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
	// defaultConfigPath 是默认配置文件名；运行时也可以用 --config 指定其他 JSON 文件。
	defaultConfigPath = "config.json"
	// defaultTimeoutSec 是单个目标默认最多等待的秒数，避免慢服务一直阻塞。
	defaultTimeoutSec = 3
	// maxRetryCount 限制最大重试次数，防止配置写错后无限重试。
	maxRetryCount = 3
)

// Config 对应 config.json 的整体结构，targets 数组里放所有探测目标。
type Config struct {
	Targets []Target `json:"targets"`
}

// Target 表示一个需要探测的服务。
// HTTP 目标通常填写完整 URL；TCP 目标通常填写 host:port。
type Target struct {
	Name           string `json:"name"`
	Address        string `json:"address"`
	Protocol       string `json:"protocol"`
	ExpectedStatus int    `json:"expected_status,omitempty"`
	ExpectedBody   string `json:"expected_body,omitempty"`
	RetryCount     int    `json:"retry_count,omitempty"`
}

// Result 保存单个目标的探测结果，后续会被统一汇总成报告。
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

// Summary 保存所有 Result 统计后的汇总信息。
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
	// main 只负责串联整体流程：解析参数 -> 读取配置 -> 并发探测 -> 生成报告 -> 保存日志。
	configPath, timeout, verbose := parseFlags(os.Args[1:])

	config, err := LoadConfig(configPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "读取配置失败: %v\n", err)
		os.Exit(1)
	}

	// RunChecks 会一次性启动所有目标的探测任务，并在全部完成后返回结果列表。
	results := RunChecks(config.Targets, timeout, verbose, os.Stdout)
	// BuildSummary 负责把每个目标的结果统计成成功率、响应时间分布等汇总数据。
	summary := BuildSummary(results)
	// BuildReport 负责把汇总数据和明细结果拼成适合终端查看的报告文本。
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
	// flag 包用于解析命令行参数，例如：go run . --config config.json --timeout 3 -v
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
	// 读取外部 JSON 配置文件，让探测目标不用写死在代码里。
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
		// 对每个目标做基础校验和默认值补全，尽量在程序启动阶段发现配置错误。
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
	// 如果地址以 http:// 或 https:// 开头，就按 HTTP 探测；否则默认按 TCP 端口探测。
	lower := strings.ToLower(address)
	if strings.HasPrefix(lower, "http://") || strings.HasPrefix(lower, "https://") {
		return "http"
	}
	return "tcp"
}

func RunChecks(targets []Target, timeout time.Duration, verbose bool, writer io.Writer) []Result {
	results := make([]Result, 0, len(targets))
	// resultCh 用来接收各个 goroutine 的探测结果，避免多个 goroutine 同时写同一个切片。
	resultCh := make(chan Result, len(targets))
	// WaitGroup 用来等待所有探测任务结束，保证报告在全部任务完成后再生成。
	var wg sync.WaitGroup

	start := time.Now()
	for _, target := range targets {
		wg.Add(1)
		// 每个目标单独启动一个 goroutine，实现并发探测。
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
	// 所有 goroutine 都已经写入结果后关闭 channel，后面的 range 才能正常结束。
	close(resultCh)

	// 只有主 goroutine 在这里写 results 切片，因此不会出现并发写切片的数据竞态。
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
	// retry_count 表示“失败后额外重试几次”，所以最大尝试次数要加上第一次执行。
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
	// CheckTarget 只处理一个目标：记录开始时间、执行协议探测、包装成功或失败结果。
	start := time.Now()
	result := Result{
		Name:      target.Name,
		Address:   target.Address,
		Protocol:  target.Protocol,
		CheckedAt: start,
	}

	// 按作业要求保留 1 秒延时，便于演示并发扫描效果。
	time.Sleep(1 * time.Second)

	// context.WithTimeout 是超时控制的核心，避免某个 HTTP/TCP 请求一直卡住。
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
	// HTTP 探测：发起 GET 请求，检查状态码，必要时再检查响应内容。
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
	// TCP 探测：尝试连接 host:port，能连上就认为端口服务可用。
	dialer := net.Dialer{}
	conn, err := dialer.DialContext(ctx, "tcp", target.Address)
	if err != nil {
		return err
	}
	return conn.Close()
}

func BuildSummary(results []Result) Summary {
	// BuildSummary 负责把多个目标的明细结果聚合成整体统计数据。
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
		// 最快和最慢服务只在成功结果中比较，避免超时失败目标干扰正常响应分析。
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
	// 简单把响应时间分成快、中、慢三档，用于报告中的响应分布统计。
	if duration < 500*time.Millisecond {
		return "快"
	}
	if duration < 2*time.Second {
		return "中"
	}
	return "慢"
}

func BuildReport(results []Result, summary Summary) string {
	// 使用 strings.Builder 拼接报告，比频繁字符串相加更适合生成较长文本。
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
	// 明细采用分块展示，长地址和长错误信息不会把表格挤乱。
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
