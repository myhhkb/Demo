package main

import "testing"

// TestCalculateBaseFee 用来测试“基础阶梯电费”是否计算正确。
//
// 这里使用的是 Go 里很常见的“表驱动测试”写法：
// 先准备多组测试数据，再用同一套测试逻辑逐个验证。
func TestCalculateBaseFee(t *testing.T) {
	tests := []struct {
		name  string
		usage float64
		want  float64
	}{
		// 100 度全部落在第一档，所以费用是 100 * 0.5 = 50。
		{name: "first tier", usage: 100, want: 50},

		// 200 度刚好卡在第一档边界，仍然全部按第一档计算。
		{name: "second tier edge", usage: 200, want: 100},

		// 300 度表示：
		// - 前 200 度按 0.5
		// - 后 100 度按 0.8
		{name: "second tier cross", usage: 300, want: 180},

		// 500 度表示：
		// - 前 200 度按第一档
		// - 中间 200 度按第二档
		// - 最后 100 度按第三档
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

// TestIsPeakHour 测试“某个小时是否属于高峰时段”的判断逻辑。
//
// 这种测试通常会重点覆盖“边界值”：
// 因为很多 bug 都出现在临界点，比如 7 点、8 点、21 点、22 点这种位置。
func TestIsPeakHour(t *testing.T) {
	tests := []struct {
		hour int
		want bool
	}{
		// 7 点还没进入高峰时段。
		{hour: 7, want: false},
		// 8 点刚好进入高峰时段。
		{hour: 8, want: true},
		// 14 点明显属于高峰时段。
		{hour: 14, want: true},
		// 21 点仍然在高峰时段内。
		{hour: 21, want: true},
		// 22 点已经不算高峰时段了。
		{hour: 22, want: false},
	}

	for _, tt := range tests {
		got := IsPeakHour(tt.hour)
		if got != tt.want {
			t.Fatalf("IsPeakHour(%d) = %v, want %v", tt.hour, got, tt.want)
		}
	}
}

// TestCalculateFinalFee 测试“完整计费流程”的最终结果。
//
// 这个测试比前面更接近真实业务：
// 它不是只测某一步，而是把多个步骤串起来验证，
// 看最终给用户的账单金额是否正确。
func TestCalculateFinalFee(t *testing.T) {
	tests := []struct {
		name  string
		usage float64
		hour  int
		want  float64
	}{
		// 400 度基础电费是：200*0.5 + 200*0.8 = 260。
		// 14 点属于高峰时段，所以最终费用为 260 * 1.10 = 286。
		{name: "peak hour", usage: 400, hour: 14, want: 286},

		// 同样是 400 度，但 23 点属于低谷时段，
		// 所以最终费用为 260 * 0.80 = 208。
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
