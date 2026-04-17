package main

import "testing"

// TestCalculate 用来验证 Calculate 函数在各种情况下是否都能正常工作。
//
// 这里依然使用表驱动测试：
// 每一项测试数据都描述一种输入场景，以及期望输出。
func TestCalculate(t *testing.T) {
	tests := []struct {
		name    string
		a       float64
		b       float64
		op      string
		want    float64
		wantErr bool
	}{
		{name: "加法", a: 10, b: 5, op: "+", want: 15},
		{name: "减法", a: 20, b: 8, op: "-", want: 12},
		{name: "乘法", a: 6, b: 7, op: "*", want: 42},
		{name: "除法", a: 100, b: 4, op: "/", want: 25},

		// 当除数是 0 时，程序应该返回错误，而不是继续运算。
		{name: "除零", a: 10, b: 0, op: "/", wantErr: true},

		// % 不在当前计算器支持的运算符列表中，也应该返回错误。
		{name: "非法运算符", a: 10, b: 5, op: "%", wantErr: true},

		// 下面这些用例是为了确认程序不仅支持整数，也支持负数和浮点数。
		{name: "负数", a: -5, b: 3, op: "+", want: -2},
		{name: "浮点数", a: 3.14, b: 2, op: "*", want: 6.28},
		{name: "科学计数法", a: 1e3, b: 2.5e-1, op: "+", want: 1000.25},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.a, tt.b, tt.op)

			if tt.wantErr {
				if err == nil {
					t.Fatalf("期望返回错误，实际没有")
				}
				return
			}

			if err != nil {
				t.Fatalf("不期望返回错误，实际错误: %v", err)
			}

			if got != tt.want {
				t.Fatalf("结果不正确，got=%v want=%v", got, tt.want)
			}
		})
	}
}
