# Webpack 基础配置

## 📋 项目结构

```
01_基础配置/
├── src/
│   ├── index.html      # HTML 模板
│   ├── index.js        # 入口文件
│   ├── math.js         # 模块文件
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

### 2. 开发模式（热更新）

```bash
npm run dev
```

自动打开 `http://localhost:8080`

### 3. 生产构建

```bash
npm run prod
```

生成优化后的 `dist` 文件夹

### 4. 普通构建

```bash
npm run build
```

---

## 🎯 核心功能演示

### 1️⃣ 模块化 - ES6 import/export

**math.js** - 导出模块
```javascript
export function add(a, b) {
  return a + b;
}
```

**index.js** - 导入模块
```javascript
import { add, multiply } from './math.js';
console.log(add(5, 3)); // 8
```

### 2️⃣ Babel 转译 - 现代 JavaScript

**webpack.config.js**
```javascript
{
  test: /\.js$/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-env']
    }
  }
}
```

支持 ES6+ 语法，自动转译为浏览器兼容的代码

### 3️⃣ CSS 加载 - 样式文件导入

**index.js**
```javascript
import './style.css';
```

**webpack.config.js**
```javascript
{
  test: /\.css$/,
  use: ['style-loader', 'css-loader']
}
```

CSS 被注入到 `<style>` 标签中

### 4️⃣ HTML 生成 - 自动生成 HTML

**webpack.config.js**
```javascript
plugins: [
  new HtmlWebpackPlugin({
    template: './src/index.html',
    filename: 'index.html'
  })
]
```

自动生成 HTML 文件并注入打包后的 JS

### 5️⃣ 开发服务器 - 热更新

**webpack.config.js**
```javascript
devServer: {
  port: 8080,
  hot: true,
  open: true
}
```

修改代码后自动刷新浏览器

---

## 📊 Webpack 配置详解

### Entry（入口）
```javascript
entry: './src/index.js'
```
指定打包的起点文件

### Output（输出）
```javascript
output: {
  path: path.resolve(__dirname, 'dist'),
  filename: 'main.js',
  clean: true  // 每次构建前清空 dist 文件夹
}
```

### Module（模块）
```javascript
module: {
  rules: [
    // Babel 规则
    { test: /\.js$/, use: 'babel-loader' },
    // CSS 规则
    { test: /\.css$/, use: ['style-loader', 'css-loader'] }
  ]
}
```

### Plugins（插件）
```javascript
plugins: [
  new HtmlWebpackPlugin({...})
]
```

---

## 🔍 构建输出

### 开发模式
```bash
npm run dev
```
- 代码未压缩，便于调试
- 包含 source map
- 启动开发服务器

### 生产模式
```bash
npm run prod
```
- 代码压缩优化
- 移除调试信息
- 文件体积最小

---

## 💡 关键概念

| 概念 | 说明 |
|------|------|
| **Entry** | 打包的入口文件 |
| **Output** | 打包的输出位置和文件名 |
| **Loader** | 处理非 JS 文件的工具 |
| **Plugin** | 扩展 webpack 功能的工具 |
| **Mode** | 开发或生产模式 |

---

## 🎓 学到的技能

✅ 配置 webpack 基础项目
✅ 使用 Babel 转译 ES6+ 代码
✅ 加载和处理 CSS 文件
✅ 自动生成 HTML 文件
✅ 使用开发服务器和热更新
✅ 理解 entry、output、loader、plugin 的概念

---

## 🚀 下一步

- 学习代码分割（Code Splitting）
- 学习懒加载（Lazy Loading）
- 学习性能优化
- 学习环境变量配置
