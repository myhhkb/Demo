package main

import (
	"fmt"
	"time"
)

// 计费相关常量：包含版本号、阶梯阈值、各档单价以及峰谷时段系数。
const (
	ruleVersion = "v1.0.0"

	// 阶梯阈值：0-200 度为第一档，200-400 度为第二档，400 度以上为第三档。
	firstTierLimit  = 200.0
	secondTierLimit = 400.0

	// 三档电价单价。
	firstTierPrice  = 0.5
	secondTierPrice = 0.8
	thirdTierPrice  = 1.2

	// 高峰时段范围：[8, 22)，也就是 08:00-21:59 视为高峰时段。
	peakStartHour = 8
	peakEndHour   = 22

	// 峰谷调节因子：高峰上浮 10%，低谷下调 20%。
	peakRateFactor    = 1.10
	offPeakRateFactor = 0.80
)

// init 在程序启动时自动执行，用于输出规则版本号和系统初始化时间。
func init() {
	fmt.Printf("计费规则版本号: %s\n", ruleVersion)
	fmt.Printf("系统初始化时间: %s\n", time.Now().Format("2026-04-013 15:04:05"))
}

// main 是程序入口，负责调用控制台交互流程。
func main() {
	runBillingConsole()
}

// runBillingConsole 负责引导用户输入用电量和时段，并打印最终账单。
func runBillingConsole() {
	var usage float64
	var hour int

	fmt.Print("请输入用电量（度）: ")
	fmt.Scanln(&usage)

	fmt.Print("请输入用电时段（小时，0-23，例如 14）: ")
	fmt.Scanln(&hour)

	finalFee := CalculateFinalFee(usage, hour)

	fmt.Println("--- 账单明细 ---")
	fmt.Printf("当前用电: %.2f 度\n", usage)
	fmt.Printf("当前时段: %02d:00 点\n", hour)
	fmt.Printf("最终电费: %.2f 元\n", finalFee)
}

// CalculateFinalFee 负责串联整个计费流程：
// 先计算基础阶梯电费，再根据峰谷时段应用调节系数。
func CalculateFinalFee(usage float64, hour int) float64 {
	baseFee := CalculateBaseFee(usage)
	return ApplyTimeFactor(baseFee, hour)
}

// CalculateBaseFee 按照阶梯电价规则计算基础电费。
// 这里的关键点是“分段累加”而不是“整段套价”：
// 例如 500 度电，前 200 度按第一档，200-400 度按第二档，超过 400 度部分按第三档。
func CalculateBaseFee(usage float64) float64 {
	if usage <= firstTierLimit {
		return usage * firstTierPrice
	}

	if usage <= secondTierLimit {
		// 超过第一档阈值后，只对超出的部分按第二档价格计费。
		return firstTierLimit*firstTierPrice + (usage-firstTierLimit)*secondTierPrice
	}

	// 超过第二档阈值后，第三档只计算 400 度以上的部分。
	return firstTierLimit*firstTierPrice +
		(secondTierLimit-firstTierLimit)*secondTierPrice +
		(usage-secondTierLimit)*thirdTierPrice
}

// ApplyTimeFactor 根据用电时段对基础电费进行峰谷调整。
func ApplyTimeFactor(baseFee float64, hour int) float64 {
	if IsPeakHour(hour) {
		return baseFee * peakRateFactor
	}

	return baseFee * offPeakRateFactor
}

// IsPeakHour 用于判断某个小时是否属于高峰时段。
// 08:00-21:59 返回 true，22:00-次日 07:59 返回 false。
func IsPeakHour(hour int) bool {
	return hour >= peakStartHour && hour < peakEndHour
}
