# calc

Go 语言基础课堂实操项目：四则运算批量计算器及单元测试。

## 项目结构

```text
calc/
├── main.go            // 命令行入口，只负责文件读写和流程控制
├── calculator.go      // 核心计算逻辑，纯函数，无 side effect
├── calculator_test.go // 单元测试
├── go.mod
└── README.md
```

## 功能说明

- 从输入文件逐行读取表达式
- 支持 `+`、`-`、`*`、`/` 四则运算
- 将每行结果写入输出文件
- 除零时输出错误信息
- 非法表达式/非法数字时输出错误信息
- 支持负数、浮点数、科学计数法输入
- 加分项：
  - 支持 `-v` 参数打印处理进度
  - 统计成功/失败数量并追加到结果文件末尾
  - 支持科学计数法输入，如 `1e3 + 2.5e-1`

## 输入文件格式

每行一条表达式，格式如下：

```text
数字 运算符 数字
```

例如：

```text
10 + 5
20 - 8
6 * 7
100 / 4
50 / 0
-5 + 3
3.14 * 2
1e3 + 2.5e-1
```

## 运行方式

在 `week04/practice/calc` 目录执行：

```bash
go run . calc.txt result.txt
```

打印处理进度：

```bash
go run . -v calc.txt result.txt
```

> 说明：Go 多文件程序通常使用 `go run .` 运行整个目录，这样会同时编译 `main.go` 和 `calculator.go`。

## 输出示例

```text
10 + 5 = 15
20 - 8 = 12
6 * 7 = 42
100 / 4 = 25
50 / 0 = ERROR: division by zero
-5 + 3 = -2
3.14 * 2 = 6.28
1e3 + 2.5e-1 = 1000.25
SUCCESS: 7
ERROR: 1
```

## 单元测试

执行：

```bash
go test ./...
```

测试覆盖：

- 正常加减乘除
- 除零错误
- 非法运算符
- 负数运算
- 浮点数精度
- 科学计数法

## 代码设计说明

- `Calculate(a, b float64, op string) (float64, error)` 负责纯计算逻辑
- `main.go` 负责命令行参数、文件读取、逐行解析、结果输出
- 使用 `strings.Fields` 拆分表达式
- 使用 `strconv.ParseFloat` 支持浮点数和科学计数法
