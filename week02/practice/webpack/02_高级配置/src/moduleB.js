// 模块 B - 会被单独打包
export function moduleB() {
  return '这是模块 B 的功能';
}

export function processData(data) {
  return data.map(item => item * 2);
}
