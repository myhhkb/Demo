package main

import (
	"fmt"
	"os"

	"ledger/cmd"
	"ledger/db"
)

func main() {
	database, dbPath, err := db.Open()
	if err != nil {
		fmt.Fprintf(os.Stderr, "错误: %v\n", err)
		os.Exit(1)
	}
	defer database.Close()

	fmt.Printf("当前数据库: %s\n", dbPath)
	if err := cmd.Run(database); err != nil {
		fmt.Fprintf(os.Stderr, "错误: %v\n", err)
		os.Exit(1)
	}
}
