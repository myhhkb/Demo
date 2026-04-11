# ledger

Go 语言基础课堂实操项目：个人账户命令行工具。

## 项目结构

```text
ledger/
├── main.go        # 程序入口，解析并分发命令
├── cmd/
│   └── handler.go # 各命令处理逻辑
├── db/
│   └── sqlite.go  # SQLite 初始化与建表
├── model/
│   └── record.go  # Record 结构体定义
├── go.mod
└── README.md
```

## 功能说明

- `ledger add -c 类别 -a 金额 -d "备注"`：新增支出记录
- `ledger list`：列出全部记录
- `ledger sum`：统计全部金额
- `ledger sum -c 类别`：统计某个分类金额
- `ledger del 记录ID`：按 ID 删除记录
- `ledger export`：导出 CSV，支持时间范围筛选

程序会把 SQLite 数据库保存为当前执行目录下的 `ledger.db`。如果在不同目录执行，会生成不同的数据库文件。

## 安装依赖

在 `week04/practice/ledger` 目录执行：

```bash
go mod tidy
```

## 运行示例

### 直接运行

```bash
go run . add -c 餐饮 -a 35.5 -d "午餐"
go run . add -c 交通 -a 6 -d "地铁"
go run . list
go run . sum
go run . sum -c 餐饮
go run . del 1
```
导出全部记录：

```bash
go run . export
```

按日期范围导出：

```bash
go run . export -start 2026-04-01 -end 2026-04-30 -out april.csv
```
### 安装为全局命令

在 `week04/practice/ledger` 目录执行：

```bash
go install
```

安装后可以直接使用：

```bash
ledger add -c 餐饮 -a 35.5 -d "午餐"
ledger add -c 交通 -a 6 -d "地铁"
ledger list
ledger sum
ledger del 1
```

## 加分项：导出 CSV

导出全部记录：

```bash
ledger export
```

按日期范围导出：

```bash
ledger export -start 2026-04-01 -end 2026-04-30 -out april.csv
```

导出的 CSV 表头如下：

```text
id,category,amount,description,created_at
```

## 说明

- `add` 中的 `-a` 支持整数和小数。
- `sum` 不传 `-c` 时统计全部记录。
- `export` 的 `-start` 和 `-end` 都是可选参数，格式必须是 `YYYY-MM-DD`。
