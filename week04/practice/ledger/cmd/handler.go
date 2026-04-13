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

func Run(database *sql.DB) error {
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

func handleAdd(database *sql.DB, args []string) error {
	fs := flag.NewFlagSet("add", flag.ContinueOnError)
	fs.SetOutput(os.Stdout)
	category := fs.String("c", "", "分类")
	amount := fs.Float64("a", 0, "金额")
	description := fs.String("d", "", "备注")
	if err := fs.Parse(args); err != nil {
		return err
	}

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

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("读取新记录 ID 失败: %w", err)
	}

	fmt.Printf("已添加记录 #%d\n", id)
	return nil
}

func handleList(database *sql.DB) error {
	records, err := queryRecords(database, "", "")
	if err != nil {
		return err
	}

	if len(records) == 0 {
		fmt.Println("暂无记录")
		return nil
	}

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

	if err := writer.Write([]string{"id", "category", "amount", "description", "created_at"}); err != nil {
		return fmt.Errorf("写入 CSV 表头失败: %w", err)
	}

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
