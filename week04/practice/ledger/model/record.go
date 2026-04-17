package model

import "time"

// Record 表示一条账本记录。
//
// 在 Go 中，struct（结构体）常用来描述一类“有多个字段的数据”。
// 这里一条消费/记账记录包含：编号、分类、金额、备注和创建时间。
type Record struct {
	// ID 是数据库里的主键编号，用来唯一标识一条记录。
	ID int64

	// Category 表示消费分类，比如“餐饮”“交通”“学习”。
	Category string

	// Amount 表示金额。
	Amount float64

	// Description 表示备注信息，用来补充说明这笔钱花在了什么地方。
	Description string

	// CreatedAt 表示记录创建时间。
	CreatedAt time.Time
}
