import { add, multiply } from './math.js';
import './style.css';

console.log('🚀 Webpack 基础配置练习');
console.log('add(5, 3) =', add(5, 3));
console.log('multiply(5, 3) =', multiply(5, 3));

// DOM 操作
const app = document.getElementById('app');
app.innerHTML = `
  <div class="container">
    <h1>✨ Webpack 基础配置</h1>
    <div class="card">
      <h2>核心功能演示</h2>
      <ul>
        <li>✅ 模块化 - 支持 ES6 import/export</li>
        <li>✅ Babel 转译 - 支持现代 JavaScript</li>
        <li>✅ CSS 加载 - 支持 CSS 文件导入</li>
        <li>✅ HTML 生成 - 自动生成 HTML 文件</li>
        <li>✅ 开发服务器 - 热更新支持</li>
      </ul>
    </div>
    <div class="card">
      <h2>计算结果</h2>
      <p>add(5, 3) = <strong>${add(5, 3)}</strong></p>
      <p>multiply(5, 3) = <strong>${multiply(5, 3)}</strong></p>
    </div>
  </div>
`;
