package main

import (
	"fmt"
	"time"
)

const (
	ruleVersion = "v1.0.0"

	firstTierLimit  = 200.0
	secondTierLimit = 400.0

	firstTierPrice  = 0.5
	secondTierPrice = 0.8
	thirdTierPrice  = 1.2

	peakStartHour = 8
	peakEndHour   = 22

	peakRateFactor    = 1.10
	offPeakRateFactor = 0.80
)

func init() {
	fmt.Printf("计费规则版本号: %s\n", ruleVersion)
	fmt.Printf("系统初始化时间: %s\n", time.Now().Format("2006-01-02 15:04:05"))
}

func main() {
	runBillingConsole()
}

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

func CalculateFinalFee(usage float64, hour int) float64 {
	baseFee := CalculateBaseFee(usage)
	return ApplyTimeFactor(baseFee, hour)
}

func CalculateBaseFee(usage float64) float64 {
	if usage <= firstTierLimit {
		return usage * firstTierPrice
	}

	if usage <= secondTierLimit {
		return firstTierLimit*firstTierPrice + (usage-firstTierLimit)*secondTierPrice
	}

	return firstTierLimit*firstTierPrice +
		(secondTierLimit-firstTierLimit)*secondTierPrice +
		(usage-secondTierLimit)*thirdTierPrice
}

func ApplyTimeFactor(baseFee float64, hour int) float64 {
	if IsPeakHour(hour) {
		return baseFee * peakRateFactor
	}

	return baseFee * offPeakRateFactor
}

func IsPeakHour(hour int) bool {
	return hour >= peakStartHour && hour < peakEndHour
}
