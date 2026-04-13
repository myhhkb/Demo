package db

import (
	"database/sql"
	"fmt"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

func Open() (*sql.DB, string, error) {
	path, err := filepath.Abs("ledger.db")
	if err != nil {
		return nil, "", fmt.Errorf("解析数据库路径失败: %w", err)
	}

	database, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, "", fmt.Errorf("打开数据库失败: %w", err)
	}

	if err := initSchema(database); err != nil {
		database.Close()
		return nil, "", err
	}

	return database, path, nil
}

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
