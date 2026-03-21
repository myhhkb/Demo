import './style.css';

console.log('🚀 Webpack 高级配置 - 代码分割和懒加载');

const app = document.getElementById('app');

app.innerHTML = `
  <div class="container">
    <h1>✨ Webpack 高级配置</h1>
    
    <div class="card">
      <h2>核心功能</h2>
      <ul>
        <li>✅ 代码分割 - 按需加载模块</li>
        <li>✅ 懒加载 - 动态 import</li>
        <li>✅ 缓存优化 - 文件名哈希</li>
        <li>✅ 性能优化 - 体积分析</li>
      </ul>
    </div>

    <div class="button-group">
      <button id="loadA" class="btn">加载模块 A</button>
      <button id="loadB" class="btn">加载模块 B</button>
      <button id="loadBoth" class="btn">加载两个模块</button>
    </div>

    <div id="result" class="result"></div>
  </div>
`;

// 懒加载模块 A
document.getElementById('loadA').addEventListener('click', async () => {
  const result = document.getElementById('result');
  result.innerHTML = '⏳ 加载中...';
  
  try {
    const { moduleA, heavyCalculation } = await import('./moduleA.js');
    result.innerHTML = `
      <div class="success">
        <p>✅ 模块 A 加载成功</p>
        <p>${moduleA()}</p>
        <p>计算结果: ${heavyCalculation()}</p>
      </div>
    `;
  } catch (error) {
    result.innerHTML = `<div class="error">❌ 加载失败: ${error.message}</div>`;
  }
});

// 懒加载模块 B
document.getElementById('loadB').addEventListener('click', async () => {
  const result = document.getElementById('result');
  result.innerHTML = '⏳ 加载中...';
  
  try {
    const { moduleB, processData } = await import('./moduleB.js');
    const data = processData([1, 2, 3, 4, 5]);
    result.innerHTML = `
      <div class="success">
        <p>✅ 模块 B 加载成功</p>
        <p>${moduleB()}</p>
        <p>处理数据: [${data.join(', ')}]</p>
      </div>
    `;
  } catch (error) {
    result.innerHTML = `<div class="error">❌ 加载失败: ${error.message}</div>`;
  }
});

// 同时加载两个模块
document.getElementById('loadBoth').addEventListener('click', async () => {
  const result = document.getElementById('result');
  result.innerHTML = '⏳ 加载中...';
  
  try {
    const [moduleAData, moduleBData] = await Promise.all([
      import('./moduleA.js'),
      import('./moduleB.js')
    ]);
    
    result.innerHTML = `
      <div class="success">
        <p>✅ 两个模块都加载成功</p>
        <p>${moduleAData.moduleA()}</p>
        <p>${moduleBData.moduleB()}</p>
      </div>
    `;
  } catch (error) {
    result.innerHTML = `<div class="error">❌ 加载失败: ${error.message}</div>`;
  }
});
