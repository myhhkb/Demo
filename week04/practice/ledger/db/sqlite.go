package db

import (
	"database/sql"
	"fmt"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

// Open 用来打开 SQLite 数据库，并确保所需的数据表已经存在。
//
// 返回值说明：
// - *sql.DB: 数据库连接对象
// - string:  数据库文件的绝对路径
// - error:   如果打开或初始化失败，会返回错误
func Open() (*sql.DB, string, error) {
	// filepath.Abs 会把相对路径转换成绝对路径，
	// 这样打印出来更直观，也方便定位数据库文件实际放在哪里。
	path, err := filepath.Abs("ledger.db")
	if err != nil {
		return nil, "", fmt.Errorf("解析数据库路径失败: %w", err)
	}

	// sql.Open 并不会立刻真正建立所有底层连接，
	// 它主要是创建一个可复用的数据库操作对象。
	database, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, "", fmt.Errorf("打开数据库失败: %w", err)
	}

	// 初始化表结构。
	if err := initSchema(database); err != nil {
		database.Close()
		return nil, "", err
	}

	return database, path, nil
}

// initSchema 负责创建程序运行所需的数据表。
// 如果表已经存在，CREATE TABLE IF NOT EXISTS 不会重复创建。
func initSchema(database *sql.DB) error {
	const schema = `
CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`

	if _, err := database.Exec(schema); err != nil {
		return fmt.Errorf("初始化数据表失败: %w", err)
	}

	return nil
}
