package cmd

import (
	"database/sql"
	"encoding/csv"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"ledger/model"
)

// Run 是命令分发入口。
//
// 它会根据用户在命令行输入的子命令，决定接下来执行哪一类操作。
// 例如：
// - ledger add    -> 新增记录
// - ledger list   -> 查看记录
// - ledger sum    -> 汇总金额
// - ledger del    -> 删除记录
// - ledger export -> 导出 CSV
func Run(database *sql.DB) error {
	// os.Args 保存的是命令行参数。
	// 如果长度小于 2，说明用户只运行了程序本身，没有输入任何子命令。
	if len(os.Args) < 2 {
		printUsage()
		return nil
	}

	switch os.Args[1] {
	case "add":
		return handleAdd(database, os.Args[2:])
	case "list":
		return handleList(database)
	case "sum":
		return handleSum(database, os.Args[2:])
	case "del":
		return handleDelete(database, os.Args[2:])
	case "export":
		return handleExport(database, os.Args[2:])
	case "help", "-h", "--help":
		printUsage()
		return nil
	default:
		return fmt.Errorf("未知命令: %s", os.Args[1])
	}
}

// handleAdd 处理新增记录命令。
//
// 示例：
//   ledger add -c 餐饮 -a 35.5 -d "午餐"
func handleAdd(database *sql.DB, args []string) error {
	// 每个子命令都单独创建自己的 FlagSet，
	// 这样不同命令的参数不会互相干扰。
	fs := flag.NewFlagSet("add", flag.ContinueOnError)
	fs.SetOutput(os.Stdout)

	category := fs.String("c", "", "分类")
	amount := fs.Float64("a", 0, "金额")
	description := fs.String("d", "", "备注")
	if err := fs.Parse(args); err != nil {
		return err
	}

	// 这里要求分类和备注不能为空。
	if strings.TrimSpace(*category) == "" || strings.TrimSpace(*description) == "" {
		return errors.New("add 命令必须提供 -c 和 -d")
	}

	result, err := database.Exec(
		"INSERT INTO records(category, amount, description) VALUES(?, ?, ?)",
		strings.TrimSpace(*category),
		*amount,
		strings.TrimSpace(*description),
	)
	if err != nil {
		return fmt.Errorf("新增记录失败: %w", err)
	}

	// LastInsertId 可以拿到数据库刚插入那条记录的主键 ID。
	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("读取新记录 ID 失败: %w", err)
	}

	fmt.Printf("已添加记录 #%d\n", id)
	return nil
}

// handleList 用来列出所有账本记录。
func handleList(database *sql.DB) error {
	records, err := queryRecords(database, "", "")
	if err != nil {
		return err
	}

	if len(records) == 0 {
		fmt.Println("暂无记录")
		return nil
	}

	// 下面使用格式化输出，把列表排成表格样式，方便阅读。
	fmt.Printf("%-4s %-12s %-10s %-22s %s\n", "ID", "分类", "金额", "时间", "备注")
	for _, record := range records {
		fmt.Printf("%-4d %-12s %-10.2f %-22s %s\n",
			record.ID,
			record.Category,
			record.Amount,
			record.CreatedAt.Format("2006-01-02 15:04:05"),
			record.Description,
		)
	}

	return nil
}

// handleSum 负责统计金额总和。
//
// 如果不传分类，就统计全部记录；
// 如果传了分类，就只统计某个分类的金额。
func handleSum(database *sql.DB, args []string) error {
	fs := flag.NewFlagSet("sum", flag.ContinueOnError)
	fs.SetOutput(os.Stdout)
	category := fs.String("c", "", "分类")
	if err := fs.Parse(args); err != nil {
		return err
	}

	query := "SELECT COALESCE(SUM(amount), 0) FROM records"
	params := []any{}
	label := "全部记录"

	if trimmed := strings.TrimSpace(*category); trimmed != "" {
		query += " WHERE category = ?"
		params = append(params, trimmed)
		label = fmt.Sprintf("分类 %s", trimmed)
	}

	var total float64
	if err := database.QueryRow(query, params...).Scan(&total); err != nil {
		return fmt.Errorf("统计金额失败: %w", err)
	}

	fmt.Printf("%s 合计: %.2f\n", label, total)
	return nil
}

// handleDelete 负责按 ID 删除某一条记录。
func handleDelete(database *sql.DB, args []string) error {
	if len(args) != 1 {
		return errors.New("del 命令必须提供记录 ID，例如: ledger del 1")
	}

	id, err := strconv.ParseInt(args[0], 10, 64)
	if err != nil {
		return fmt.Errorf("记录 ID 无效: %w", err)
	}

	result, err := database.Exec("DELETE FROM records WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("删除记录失败: %w", err)
	}

	// RowsAffected 表示这次 SQL 实际影响了多少行。
	// 如果是 0，说明数据库里没有这条记录。
	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("读取删除结果失败: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("未找到 ID 为 %d 的记录", id)
	}

	fmt.Printf("已删除记录 #%d\n", id)
	return nil
}

// handleExport 负责把记录导出成 CSV 文件。
// CSV 可以直接用 Excel、WPS 表格等工具打开。
func handleExport(database *sql.DB, args []string) error {
	fs := flag.NewFlagSet("export", flag.ContinueOnError)
	fs.SetOutput(os.Stdout)
	start := fs.String("start", "", "开始日期，格式 YYYY-MM-DD")
	end := fs.String("end", "", "结束日期，格式 YYYY-MM-DD")
	out := fs.String("out", "ledger-export.csv", "导出文件名")
	if err := fs.Parse(args); err != nil {
		return err
	}

	records, err := queryRecords(database, strings.TrimSpace(*start), strings.TrimSpace(*end))
	if err != nil {
		return err
	}

	outputPath, err := filepath.Abs(*out)
	if err != nil {
		return fmt.Errorf("解析导出文件路径失败: %w", err)
	}

	file, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("创建导出文件失败: %w", err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 先写表头。
	if err := writer.Write([]string{"id", "category", "amount", "description", "created_at"}); err != nil {
		return fmt.Errorf("写入 CSV 表头失败: %w", err)
	}

	// 再逐条写入数据行。
	for _, record := range records {
		row := []string{
			strconv.FormatInt(record.ID, 10),
			record.Category,
			fmt.Sprintf("%.2f", record.Amount),
			record.Description,
			record.CreatedAt.Format("2006-01-02 15:04:05"),
		}
		if err := writer.Write(row); err != nil {
			return fmt.Errorf("写入 CSV 数据失败: %w", err)
		}
	}

	if err := writer.Error(); err != nil {
		return fmt.Errorf("刷新 CSV 失败: %w", err)
	}

	fmt.Printf("已导出 %d 条记录到 %s\n", len(records), outputPath)
	return nil
}

// queryRecords 负责根据日期范围查询账本记录。
//
// 参数 start 和 end 都可以为空：
// - 都为空：查询全部记录
// - 只传 start：查询某天及之后的记录
// - 只传 end：查询某天及之前的记录
// - 都传：查询一个时间区间内的记录
func queryRecords(database *sql.DB, start, end string) ([]model.Record, error) {
	query := "SELECT id, category, amount, description, created_at FROM records"
	params := []any{}
	conditions := []string{}

	if start != "" {
		if _, err := time.Parse("2006-01-02", start); err != nil {
			return nil, fmt.Errorf("开始日期格式错误: %w", err)
		}
		conditions = append(conditions, "date(created_at) >= date(?)")
		params = append(params, start)
	}

	if end != "" {
		if _, err := time.Parse("2006-01-02", end); err != nil {
			return nil, fmt.Errorf("结束日期格式错误: %w", err)
		}
		conditions = append(conditions, "date(created_at) <= date(?)")
		params = append(params, end)
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY id ASC"

	rows, err := database.Query(query, params...)
	if err != nil {
		return nil, fmt.Errorf("查询记录失败: %w", err)
	}
	defer rows.Close()

	records := make([]model.Record, 0)
	for rows.Next() {
		var record model.Record
		var createdAt string

		if err := rows.Scan(&record.ID, &record.Category, &record.Amount, &record.Description, &createdAt); err != nil {
			return nil, fmt.Errorf("读取记录失败: %w", err)
		}

		parsed, err := parseTime(createdAt)
		if err != nil {
			return nil, err
		}
		record.CreatedAt = parsed
		records = append(records, record)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历记录失败: %w", err)
	}

	return records, nil
}

// parseTime 负责把数据库中的时间字符串转换成 Go 的 time.Time。
//
// 因为不同来源的时间字符串格式可能不完全一样，
// 所以这里准备了多个候选格式，依次尝试解析。
func parseTime(value string) (time.Time, error) {
	layouts := []string{
		"2006-01-02 15:04:05",
		time.RFC3339,
	}

	for _, layout := range layouts {
		parsed, err := time.ParseInLocation(layout, value, time.Local)
		if err == nil {
			return parsed, nil
		}
	}

	return time.Time{}, fmt.Errorf("解析时间失败: %s", value)
}

// printUsage 用来打印命令帮助信息。
func printUsage() {
	fmt.Println(`个人账本命令行工具

用法:
  ledger add -c 餐饮 -a 35.5 -d "午餐"
  ledger list
  ledger sum
  ledger sum -c 餐饮
  ledger del 1
  ledger export -start 2026-04-01 -end 2026-04-30 -out april.csv`)
}
