import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ReactDOM.createRoot 用来创建 React 18 的根节点。
// 它会把整个 React 应用挂载到 public/index.html 中的 #root 元素上。
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode 是 React 提供的开发辅助模式。
  // 它不会影响生产环境，但在开发时能帮助发现潜在问题。
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
