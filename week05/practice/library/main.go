package main

import (
	"bufio"
	"bytes"
	"flag"
	"fmt"
	"os"
	"strconv"
	"strings"
	"unicode/utf8"
)

func main() {
	filePath := flag.String("file", "", "要处理的文件路径")
	operation := flag.String("operation", "", "操作类型: count | upper | convert")
	outputPath := flag.String("output", "", "输出文件路径（省略则写到标准输出）")

	flag.Usage = func() {
		w := flag.CommandLine.Output()
		fmt.Fprintf(w, "用法: %s -file <路径> -operation <类型> [-output <路径>]\n\n", os.Args[0])
		flag.PrintDefaults()
		fmt.Fprintln(w, "\n操作说明:")
		fmt.Fprintln(w, "  count   统计字节数、Unicode 字符数(码点数)、行数")
		fmt.Fprintln(w, "  upper   将全文转为大写")
		fmt.Fprintln(w, "  convert 逐行解析整数(支持十进制/0x 十六进制/0 八进制等)，输出十进制、十六进制、二进制")
	}

	flag.Parse()

	if *filePath == "" {
		fmt.Fprintln(os.Stderr, "错误: 必须指定 -file")
		flag.Usage()
		os.Exit(1)
	}
	if *operation == "" {
		fmt.Fprintln(os.Stderr, "错误: 必须指定 -operation")
		flag.Usage()
		os.Exit(1)
	}

	data, err := os.ReadFile(*filePath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "读取文件失败: %v\n", err)
		os.Exit(1)
	}

	op := strings.ToLower(strings.TrimSpace(*operation))
	var result string

	switch op {
	case "count":
		result, err = opCount(data)
		if err != nil {
			fmt.Fprintf(os.Stderr, "count 处理失败: %v\n", err)
			os.Exit(1)
		}
	case "upper":
		result = opUpper(data)
	case "convert":
		result, err = opConvert(data)
		if err != nil {
			fmt.Fprintf(os.Stderr, "convert 处理失败: %v\n", err)
			os.Exit(1)
		}
	default:
		fmt.Fprintf(os.Stderr, "未知操作 %q，支持: count、upper、convert\n", *operation)
		flag.Usage()
		os.Exit(1)
	}

	if *outputPath != "" {
		if err := os.WriteFile(*outputPath, []byte(result), 0644); err != nil {
			fmt.Fprintf(os.Stderr, "写入输出文件失败: %v\n", err)
			os.Exit(1)
		}
		fmt.Fprintf(os.Stderr, "已写入: %s\n", *outputPath)
		return
	}
	fmt.Print(result)
}

func opCount(data []byte) (string, error) {
	text := string(data)
	runes := utf8.RuneCountInString(text)
	bytesN := len(data)

	lineCount := 0
	sc := bufio.NewScanner(strings.NewReader(text))
	buf := make([]byte, 0, 64*1024)
	sc.Buffer(buf, 1024*1024)
	for sc.Scan() {
		lineCount++
	}
	if err := sc.Err(); err != nil {
		return "", err
	}

	var b strings.Builder
	fmt.Fprintf(&b, "字节数: %d\n", bytesN)
	fmt.Fprintf(&b, "字符数(Unicode 码点): %d\n", runes)
	fmt.Fprintf(&b, "行数: %d\n", lineCount)
	return b.String(), nil
}

func opUpper(data []byte) string {
	return strings.ToUpper(string(data))
}

// opConvert 每行 trim 后尝试按 strconv.ParseInt(..., 0, 64) 解析（支持 0x、0 前缀等），
// 成功则输出：十进制 \t 十六进制 \t 二进制；失败则输出提示行。
func opConvert(data []byte) (string, error) {
	sc := bufio.NewScanner(bytes.NewReader(data))
	buf := make([]byte, 0, 64*1024)
	sc.Buffer(buf, 1024*1024)

	var b strings.Builder
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" {
			b.WriteByte('\n')
			continue
		}
		n, err := strconv.ParseInt(line, 0, 64)
		if err != nil {
			fmt.Fprintf(&b, "%s\t(无法解析为整数: %v)\n", line, err)
			continue
		}
		fmt.Fprintf(&b, "%d\t0x%x\t%s\n", n, n, strconv.FormatInt(n, 2))
	}
	if err := sc.Err(); err != nil {
		return "", err
	}
	return b.String(), nil
}
