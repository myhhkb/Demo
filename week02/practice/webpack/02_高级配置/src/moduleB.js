// 模块 B：同样会被单独打包成一个代码块。
export function moduleB() {
  return '这是模块 B 的功能';
}

// processData 用来演示模块导出函数的另一种用途：处理传入的数据。
// 这里把数组中的每一个元素都乘以 2，再返回一个新数组。
export function processData(data) {
  return data.map(item => item * 2);
}
