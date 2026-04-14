package main

import "testing"

// TestCalculateBaseFee 验证基础阶梯电费计算是否正确。
//
// 这里使用表驱动测试，把多组输入和期望结果放进同一个切片里统一校验：
// - usage: 表示测试输入的用电量。
// - want: 表示“期望得到的结果”，也就是我们预先手工算好的正确电费。
//
// 例如：
// - usage=100 时，还在第一档，电费应为 100 * 0.5 = 50。
// - usage=300 时，前 200 度按 0.5 计算，后 100 度按 0.8 计算，结果应为 180。
func TestCalculateBaseFee(t *testing.T) {
	tests := []struct {
		name  string
		usage float64
		want  float64
	}{
		{name: "first tier", usage: 100, want: 50},
		{name: "second tier edge", usage: 200, want: 100},
		{name: "second tier cross", usage: 300, want: 180},
		{name: "third tier cross", usage: 500, want: 380},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateBaseFee(tt.usage)
			if got != tt.want {
				t.Fatalf("CalculateBaseFee(%v) = %v, want %v", tt.usage, got, tt.want)
			}
		})
	}
}

// TestIsPeakHour 验证高峰时段判断逻辑是否正确。
//
// 根据题目要求：
// - 高峰时段是 08:00-22:00
// - 低谷时段是 22:00-次日 08:00
//
// 所以这里重点测试边界值：
// - 7 点：还没到高峰时段，应为 false。
// - 8 点：刚进入高峰时段，应为 true。
// - 21 点：仍然属于高峰时段，应为 true。
// - 22 点：已经进入低谷时段，应为 false。
func TestIsPeakHour(t *testing.T) {
	tests := []struct {
		hour int
		want bool
	}{
		{hour: 7, want: false},
		{hour: 8, want: true},
		{hour: 14, want: true},
		{hour: 21, want: true},
		{hour: 22, want: false},
	}

	for _, tt := range tests {
		got := IsPeakHour(tt.hour)
		if got != tt.want {
			t.Fatalf("IsPeakHour(%d) = %v, want %v", tt.hour, got, tt.want)
		}
	}
}

// TestCalculateFinalFee 验证完整计费流程是否正确。
//
// 这个测试不是只测某一个小函数，而是验证“完整结果”：
// 1. 先根据用电量计算基础阶梯电费。
// 2. 再根据 hour 判断当前属于高峰还是低谷。
// 3. 最后应用对应的调节系数，得到最终电费。
//
// 以 400 度为例：
// - 基础电费 = 200*0.5 + 200*0.8 = 260
// - 如果 hour=14，属于高峰时段，最终费用 = 260 * 1.10 = 286
// - 如果 hour=23，属于低谷时段，最终费用 = 260 * 0.80 = 208
func TestCalculateFinalFee(t *testing.T) {
	tests := []struct {
		name  string
		usage float64
		hour  int
		want  float64
	}{
		{name: "peak hour", usage: 400, hour: 14, want: 286},
		{name: "off peak hour", usage: 400, hour: 23, want: 208},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateFinalFee(tt.usage, tt.hour)
			if got != tt.want {
				t.Fatalf("CalculateFinalFee(%v, %d) = %v, want %v", tt.usage, tt.hour, got, tt.want)
			}
		})
	}
}
