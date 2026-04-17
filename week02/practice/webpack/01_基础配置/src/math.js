// add：返回两个数字相加的结果。
export function add(a, b) {
  return a + b;
}

// multiply：返回两个数字相乘的结果。
export function multiply(a, b) {
  return a * b;
}

// subtract：返回两个数字相减的结果。
export function subtract(a, b) {
  return a - b;
}

// divide：返回两个数字相除的结果。
// 如果除数 b 是 0，就返回错误提示字符串，避免出现无意义结果。
export function divide(a, b) {
  return b !== 0 ? a / b : 'Error: Division by zero';
}
