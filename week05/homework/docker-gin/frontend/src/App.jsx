import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import QueryPage from './pages/QueryPage'
import WordListPage from './pages/WordListPage'

export default function App() {
  // 从本地存储恢复用户名；如果没有 token/username，就会进入登录页。
  const [user, setUser] = useState(localStorage.getItem('username') || '')
  // 控制当前显示“查询单词”还是“我的单词本”。
  const [activeTab, setActiveTab] = useState('query')

  // 登录成功后，把用户名同步到 App 状态，页面就会切到主界面。
  const handleLogin = (username) => {
    setUser(username)
  }

  // 退出登录时清掉本地 token 和用户名，回到登录页。
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUser('')
  }

  // 没登录就只渲染登录页。
  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="container">
      <nav className="navbar">
        <h1>AI 智能单词本</h1>
        <div className="user-info">
          <span>欢迎, {user}</span>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '6px 16px' }}>
            退出登录
          </button>
        </div>
      </nav>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'query' ? 'active' : ''}`}
          onClick={() => setActiveTab('query')}
        >
          查询单词
        </button>
        <button
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          我的单词本
        </button>
      </div>

      {/* 根据 tab 切换不同页面组件。 */}
      {activeTab === 'query' && <QueryPage />}
      {activeTab === 'list' && <WordListPage />}
    </div>
  )
}
