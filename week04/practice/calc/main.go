package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// stats 用来统计本次批量计算的处理结果。
//
// 字段说明：
// - total:   总共处理了多少条表达式
// - success: 成功计算了多少条
// - failed:  失败了多少条
//
// 这种结构体适合把“相关的数据”放在一起统一管理。
type stats struct {
	total   int
	success int
	failed  int
}

// main 是命令行程序的入口。
// 这个程序的作用是：
// 1. 从输入文件中逐行读取算式
// 2. 调用 Calculate 计算结果
// 3. 把结果写入输出文件
func main() {
	// -v 是一个布尔类型命令行参数。
	// 如果用户执行：go run main.go -v calc.txt result.txt
	// 那么 verbose 的值就会是 true，程序会额外打印处理过程。
	verbose := flag.Bool("v", false, "打印处理进度")
	flag.Parse()

	// flag.NArg() 表示“除去选项参数后，还剩多少个普通参数”。
	// 这里要求用户必须传入：输入文件路径 + 输出文件路径。
	if flag.NArg() != 2 {
		fmt.Fprintln(os.Stderr, "用法: go run main.go [-v] calc.txt result.txt")
		os.Exit(1)
	}

	inputPath := flag.Arg(0)
	outputPath := flag.Arg(1)

	if err := processFile(inputPath, outputPath, *verbose); err != nil {
		fmt.Fprintf(os.Stderr, "错误: %v\n", err)
		os.Exit(1)
	}
}

// processFile 负责完成“文件到文件”的整个处理流程。
//
// 它会：
// - 打开输入文件
// - 创建输出文件
// - 一行一行读取表达式
// - 逐行计算并写出结果
// - 最后附加成功/失败统计信息
func processFile(inputPath, outputPath string, verbose bool) error {
	inputFile, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("打开输入文件失败: %w", err)
	}
	defer inputFile.Close()

	outputFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("创建输出文件失败: %w", err)
	}
	defer outputFile.Close()

	// Scanner 适合按行读取文本文件。
	scanner := bufio.NewScanner(inputFile)

	// Writer 适合把多次写操作先缓存在内存里，
	// 最后统一刷到磁盘，提高效率。
	writer := bufio.NewWriter(outputFile)
	defer writer.Flush()

	resultStats := stats{}
	lineNo := 0

	for scanner.Scan() {
		lineNo++
		line := strings.TrimSpace(scanner.Text())

		// 空行直接跳过，不参与统计。
		if line == "" {
			continue
		}

		resultStats.total++
		resultLine, ok := evaluateExpression(line)
		if ok {
			resultStats.success++
		} else {
			resultStats.failed++
		}

		if verbose {
			fmt.Printf("[%d] %s\n", lineNo, resultLine)
		}

		if _, err := writer.WriteString(resultLine + "\n"); err != nil {
			return fmt.Errorf("写入结果失败: %w", err)
		}
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("读取输入文件失败: %w", err)
	}

	// 最后把统计信息写到输出文件末尾。
	if _, err := writer.WriteString(fmt.Sprintf("SUCCESS: %d\nERROR: %d\n", resultStats.success, resultStats.failed)); err != nil {
		return fmt.Errorf("写入统计信息失败: %w", err)
	}

	return nil
}

// evaluateExpression 负责处理一行算式文本。
//
// 例如输入：
//   10 + 20
//
// 它会把这行内容拆分成：
// - 第一个数字 10
// - 运算符 +
// - 第二个数字 20
//
// 然后交给 Calculate 去真正计算。
func evaluateExpression(line string) (string, bool) {
	parts := strings.Fields(line)
	if len(parts) != 3 {
		return fmt.Sprintf("%s = ERROR: invalid expression", line), false
	}

	a, err := strconv.ParseFloat(parts[0], 64)
	if err != nil {
		return fmt.Sprintf("%s = ERROR: invalid number", line), false
	}

	op := parts[1]
	b, err := strconv.ParseFloat(parts[2], 64)
	if err != nil {
		return fmt.Sprintf("%s = ERROR: invalid number", line), false
	}

	result, err := Calculate(a, b, op)
	if err != nil {
		return fmt.Sprintf("%s = ERROR: %s", line, err.Error()), false
	}

	return fmt.Sprintf("%s = %s", line, formatFloat(result)), true
}

// formatFloat 用来把 float64 转成更适合展示的字符串。
//
// 参数中的 'f', -1, 64 含义可以简单理解为：
// - 用十进制小数格式输出
// - 自动去掉没必要的尾随 0
// - 按 float64 精度处理
func formatFloat(value float64) string {
	return strconv.FormatFloat(value, 'f', -1, 64)
}
