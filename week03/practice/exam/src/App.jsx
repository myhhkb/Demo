import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Exam from './pages/Exam'
import Result from './pages/Result'

// App 是整个 React 应用的根组件。
// 这里最主要的职责是：配置前端路由。
function App() {
  return (
    // BrowserRouter 用来开启“基于浏览器地址栏”的路由功能。
    <BrowserRouter>
      <Routes>
        {/* 首页：可以通过 / 或 /home 访问 */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* 考试页 */}
        <Route path="/exam" element={<Exam />} />

        {/* 结果页 */}
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
