import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// React 应用的入口：把 App 挂载到 index.html 里的 root 容器上。
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
