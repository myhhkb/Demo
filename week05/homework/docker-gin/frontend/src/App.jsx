import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import QueryPage from './pages/QueryPage'
import WordListPage from './pages/WordListPage'

export default function App() {
  const [user, setUser] = useState(localStorage.getItem('username') || '')
  const [activeTab, setActiveTab] = useState('query')

  const handleLogin = (username) => {
    setUser(username)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUser('')
  }

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

      {activeTab === 'query' && <QueryPage />}
      {activeTab === 'list' && <WordListPage />}
    </div>
  )
}
