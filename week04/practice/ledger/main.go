package main

import (
	"fmt"
	"os"

	"ledger/cmd"
	"ledger/db"
)

// main 是账本程序的入口。
// 它主要负责两件事：
// 1. 打开并初始化数据库
// 2. 把后续命令交给 cmd 包处理
func main() {
	// 打开数据库，同时拿到数据库实际路径。
	database, dbPath, err := db.Open()
	if err != nil {
		fmt.Fprintf(os.Stderr, "错误: %v\n", err)
		os.Exit(1)
	}

	// defer 表示“先记住，函数结束前再执行”。
	// 这里用于确保程序退出前数据库能被正确关闭。
	defer database.Close()

	fmt.Printf("当前数据库: %s\n", dbPath)

	// 真正的命令处理逻辑由 cmd.Run 完成。
	if err := cmd.Run(database); err != nil {
		fmt.Fprintf(os.Stderr, "错误: %v\n", err)
		os.Exit(1)
	}
}
