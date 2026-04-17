// 模块 A：演示被 Webpack 单独拆分出来的代码模块。
// 当用户真正需要它时，才会被动态加载。
export function moduleA() {
  return '这是模块 A 的功能';
}

// heavyCalculation 用来模拟“体积较大或计算较重”的逻辑。
// 真实项目里，这种逻辑很适合按需加载，避免首次打开页面时全部下载。
export function heavyCalculation() {
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += i;
  }
  return sum;
}
