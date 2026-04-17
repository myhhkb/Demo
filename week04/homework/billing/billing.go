package main

import (
	"fmt"
	"time"
)

// 计费相关常量：包含版本号、阶梯阈值、各档单价以及峰谷时段系数。
const (
	// ruleVersion 表示当前这套计费规则的版本号，方便后续升级时区分规则。
	ruleVersion = "v1.0.0"

	// 阶梯阈值：
	// - 0 到 200 度：第一档
	// - 200 到 400 度：第二档
	// - 400 度以上：第三档
	firstTierLimit  = 200.0
	secondTierLimit = 400.0

	// 三档对应的单价（单位：元/度）。
	firstTierPrice  = 0.5
	secondTierPrice = 0.8
	thirdTierPrice  = 1.2

	// 高峰时段范围：[8, 22)
	// 也就是 08:00 到 21:59 属于高峰时段。
	peakStartHour = 8
	peakEndHour   = 22

	// 峰谷调节因子：
	// - 高峰时段：基础电费 * 1.10，表示上浮 10%
	// - 低谷时段：基础电费 * 0.80，表示打 8 折
	peakRateFactor    = 1.10
	offPeakRateFactor = 0.80
)

// init 会在 main 执行之前自动运行。
// 这里主要用于打印程序启动时的说明信息。
func init() {
	fmt.Printf("计费规则版本号: %s\n", ruleVersion)
	fmt.Printf("系统初始化时间: %s\n", time.Now().Format("2006-01-02 15:04:05"))
}

// main 是 Go 程序的入口函数。
// 程序启动后，会从这里开始执行。
func main() {
	runBillingConsole()
}

// runBillingConsole 负责控制台交互：
// 1. 读取用户输入的用电量
// 2. 读取用户输入的用电时段
// 3. 调用计费函数得到最终电费
// 4. 把账单打印出来
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

// CalculateFinalFee 负责串联整个计费流程。
// 它本身不直接写具体规则，而是把任务拆成两步：
// 1. 先计算基础阶梯电费
// 2. 再根据峰谷时段进行调整
func CalculateFinalFee(usage float64, hour int) float64 {
	baseFee := CalculateBaseFee(usage)
	return ApplyTimeFactor(baseFee, hour)
}

// CalculateBaseFee 按照“阶梯电价”计算基础电费。
// 这里一定要注意：不是所有用电都按同一档价格算，
// 而是“每一段用电量”按各自所属的档位分别计算，再累加。
func CalculateBaseFee(usage float64) float64 {
	// 如果用电量不超过 200 度，那么全部按第一档单价计算。
	if usage <= firstTierLimit {
		return usage * firstTierPrice
	}

	// 如果用电量在 200 到 400 度之间：
	// - 前 200 度按第一档
	// - 超出 200 度的部分按第二档
	if usage <= secondTierLimit {
		return firstTierLimit*firstTierPrice + (usage-firstTierLimit)*secondTierPrice
	}

	// 如果超过 400 度：
	// - 前 200 度按第一档
	// - 中间 200 度（200~400）按第二档
	// - 超过 400 度的部分按第三档
	return firstTierLimit*firstTierPrice +
		(secondTierLimit-firstTierLimit)*secondTierPrice +
		(usage-secondTierLimit)*thirdTierPrice
}

// ApplyTimeFactor 根据用电时段，对基础电费乘上不同系数。
func ApplyTimeFactor(baseFee float64, hour int) float64 {
	if IsPeakHour(hour) {
		return baseFee * peakRateFactor
	}

	return baseFee * offPeakRateFactor
}

// IsPeakHour 判断某个小时是不是高峰时段。
// 返回值说明：
// - true：表示当前是高峰时段
// - false：表示当前是低谷时段
func IsPeakHour(hour int) bool {
	return hour >= peakStartHour && hour < peakEndHour
}
