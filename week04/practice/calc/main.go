package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type stats struct {
	total   int
	success int
	failed  int
}

func main() {
	verbose := flag.Bool("v", false, "打印处理进度")
	flag.Parse()

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

	scanner := bufio.NewScanner(inputFile)
	writer := bufio.NewWriter(outputFile)
	defer writer.Flush()

	resultStats := stats{}
	lineNo := 0
	for scanner.Scan() {
		lineNo++
		line := strings.TrimSpace(scanner.Text())
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

	if _, err := writer.WriteString(fmt.Sprintf("SUCCESS: %d\nERROR: %d\n", resultStats.success, resultStats.failed)); err != nil {
		return fmt.Errorf("写入统计信息失败: %w", err)
	}

	return nil
}

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

func formatFloat(value float64) string {
	return strconv.FormatFloat(value, 'f', -1, 64)
}
