// 模块 A - 会被单独打包
export function moduleA() {
  return '这是模块 A 的功能';
}

export function heavyCalculation() {
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += i;
  }
  return sum;
}
