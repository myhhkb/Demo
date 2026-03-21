# Webpack 高级配置 - 代码分割和懒加载

## 📋 项目结构

```
02_高级配置/
├── src/
│   ├── index.html      # HTML 模板
│   ├── index.js        # 入口文件
│   ├── moduleA.js      # 模块 A（会被单独打包）
│   ├── moduleB.js      # 模块 B（会被单独打包）
│   └── style.css       # 样式文件
├── webpack.config.js   # Webpack 配置
├── package.json        # 项目配置
└── README.md           # 说明文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
npm run dev
```

访问 `http://localhost:8081`

### 3. 生产构建

```bash
npm run prod
```

---

## 🎯 核心功能演示

### 1️⃣ 代码分割 - Code Splitting

**webpack.config.js**
```javascript
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      // 提取 node_modules 中的代码
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10
      },
      // 提取公共代码
      common: {
        minChunks: 2,
        priority: 5,
        reuseExistingChunk: true
      }
    }
  }
}
```

**优势：**
- 减小主文件体积
- 提高缓存效率
- 并行加载

### 2️⃣ 懒加载 - Lazy Loading

**index.js**
```javascript
// 动态 import - 按需加载
document.getElementById('loadA').addEventListener('click', async () => {
  const { moduleA } = await import('./moduleA.js');
  console.log(moduleA());
});
```

**工作原理：**
1. 点击按钮时触发加载
2. Webpack 自动创建 chunk 文件
3. 浏览器动态加载 chunk
4. 执行模块代码

### 3️⃣ 文件名哈希 - 缓存优化

**webpack.config.js**
```javascript
output: {
  filename: '[name].[contenthash:8].js',
  chunkFilename: '[name].[contenthash:8].chunk.js'
}
```

**说明：**
- `[name]` - 文件名
- `[contenthash:8]` - 内容哈希（8位）
- 内容不变，文件名不变
- 浏览器可以长期缓存

---

## 📊 打包输出

### 开发模式输出
```
dist/
├── index.html
├── main.js              # 主文件
├── moduleA.chunk.js     # 模块 A（按需加载）
└── moduleB.chunk.js     # 模块 B（按需加载）
```

### 生产模式输出
```
dist/
├── index.html
├── main.abc12345.js              # 压缩后的主文件
├── moduleA.def67890.chunk.js     # 压缩后的模块 A
└── moduleB.ghi34567.chunk.js     # 压缩后的模块 B
```

---

## 🔄 懒加载流程

```
用户点击按钮
    ↓
触发 import('./moduleA.js')
    ↓
Webpack 检查是否已加载
    ↓
如果未加载，发送网络请求
    ↓
浏览器下载 moduleA.chunk.js
    ↓
执行模块代码
    ↓
返回模块导出
    ↓
显示结果
```

---

## 💡 关键概念

| 概念 | 说明 |
|------|------|
| **Code Splitting** | 将代码分割成多个文件 |
| **Lazy Loading** | 按需加载代码 |
| **Chunk** | 代码分割后的文件块 |
| **Dynamic Import** | 动态导入模块 |
| **Content Hash** | 基于内容的哈希值 |

---

## 🎓 学到的技能

✅ 配置代码分割规则
✅ 使用动态 import 实现懒加载
✅ 优化文件名和缓存策略
✅ 理解 chunk 和 bundle 的概念
✅ 性能优化最佳实践

---

## 📈 性能对比

### 不使用代码分割
```
main.js: 500KB
加载时间: 2s
```

### 使用代码分割 + 懒加载
```
main.js: 100KB (初始加载)
moduleA.chunk.js: 150KB (按需加载)
moduleB.chunk.js: 150KB (按需加载)
初始加载时间: 0.5s
```

---

## 🚀 实验步骤

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **打开浏览器开发者工具**
   - F12 → Network 标签
   - 观察初始加载的文件

3. **点击"加载模块 A"按钮**
   - 观察 Network 标签
   - 看到 `moduleA.chunk.js` 被加载
   - 查看 Console 输出

4. **点击"加载模块 B"按钮**
   - 观察 `moduleB.chunk.js` 被加载

5. **点击"加载两个模块"按钮**
   - 两个 chunk 并行加载

6. **生产构建**
   ```bash
   npm run prod
   ```
   - 查看 dist 文件夹
   - 观察文件名中的哈希值

---

## 🔍 浏览器开发者工具

### 查看网络请求
1. 打开 DevTools (F12)
2. 切换到 Network 标签
3. 点击按钮加载模块
4. 观察 chunk 文件的加载

### 查看控制台
1. 打开 DevTools (F12)
2. 切换到 Console 标签
3. 查看模块加载的日志

### 查看源代码
1. 打开 DevTools (F12)
2. 切换到 Sources 标签
3. 查看打包后的代码结构

---

## 💡 最佳实践

1. **合理分割代码**
   - 按功能模块分割
   - 避免过度分割

2. **优化加载策略**
   - 关键路径优先加载
   - 非关键功能延迟加载

3. **监控性能**
   - 使用 webpack-bundle-analyzer
   - 分析包体积

4. **缓存策略**
   - 使用内容哈希
   - 分离第三方库

---

## 🚀 下一步学习

- 学习 webpack 插件开发
- 学习性能监控和分析
- 学习 Tree Shaking
- 学习 Module Federation
