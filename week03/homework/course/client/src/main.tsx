import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// React 应用入口。
// createRoot 会把整个前端应用挂载到 index.html 中的 #root 节点上。
ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode 是 React 的开发辅助模式，
  // 用来帮助我们更早发现潜在问题。
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
