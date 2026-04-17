package main

import "fmt"

// Calculate 是一个简易计算器函数。
// 它接收两个数字和一个运算符，然后返回计算结果。
//
// 参数说明：
// - a: 第一个数字
// - b: 第二个数字
// - op: 运算符，比如 +、-、*、/
//
// 返回值说明：
// - 第一个返回值：计算结果
// - 第二个返回值：错误信息；如果没有错误，则为 nil
func Calculate(a, b float64, op string) (float64, error) {
	switch op {
	case "+":
		// 加法：直接返回 a + b。
		return a + b, nil
	case "-":
		// 减法：返回 a - b。
		return a - b, nil
	case "*":
		// 乘法：返回 a * b。
		return a * b, nil
	case "/":
		// 除法要特别注意：除数不能为 0。
		if b == 0 {
			return 0, fmt.Errorf("division by zero")
		}
		return a / b, nil
	default:
		// 如果传入的运算符不是我们支持的类型，就返回错误。
		return 0, fmt.Errorf("unsupported operator: %s", op)
	}
}
