// 从 math.js 中导入 add 和 multiply 两个函数。
// 这就是 ES Module 的模块化写法。
import { add, multiply } from './math.js';

// 导入 CSS 文件。
// 在普通浏览器里，JS 不能直接这样引入 CSS，
// 但在 Webpack 里，经过 loader 处理后就可以做到。
import './style.css';

// 在控制台里打印一些日志，方便观察程序是否成功执行。
console.log('🚀 Webpack 基础配置练习');
console.log('add(5, 3) =', add(5, 3));
console.log('multiply(5, 3) =', multiply(5, 3));

// 获取页面中的根节点。
// 后面我们会把整块 HTML 内容动态插入进去。
const app = document.getElementById('app');

// 使用模板字符串一次性生成页面内容。
// 这里演示了：
// - 如何用 JS 动态渲染页面
// - 如何把函数计算结果插入到 HTML 中
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
