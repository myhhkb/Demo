import { useState } from 'react'
import { login, register } from '../api'

// 登录/注册页：负责用户身份进入系统。
export default function LoginPage({ onLogin }) {
  // false 表示登录态，true 表示注册态。
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // 提交表单时，根据当前模式执行登录或注册。
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (isRegister) {
        // 前端先做基础校验，减少无效请求。
        if (username.length < 3) {
          setMessage({ type: 'error', text: '用户名至少3个字符' })
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setMessage({ type: 'error', text: '密码至少6个字符' })
          setLoading(false)
          return
        }
        await register(username, password)
        setMessage({ type: 'success', text: '注册成功，请登录' })
        setIsRegister(false)
        setPassword('')
      } else {
        // 登录成功后把 token 和用户名保存到 localStorage。
        const res = await login(username, password)
        const { token, username: uname } = res.data.data
        localStorage.setItem('token', token)
        localStorage.setItem('username', uname)
        onLogin(uname)
      }
    } catch (err) {
      const msg = err.response?.data?.message || '操作失败，请重试'
      setMessage({ type: 'error', text: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <h2>{isRegister ? '注册账号' : '登录'}</h2>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div className="input-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading && <span className="loading-spinner" />}
            {isRegister ? '注册' : '登录'}
          </button>
        </form>

        <div className="switch-link">
          {isRegister ? (
            <span>已有账号？<a onClick={() => { setIsRegister(false); setMessage({ type: '', text: '' }) }}>去登录</a></span>
          ) : (
            <span>没有账号？<a onClick={() => { setIsRegister(true); setMessage({ type: '', text: '' }) }}>去注册</a></span>
          )}
        </div>
      </div>
    </div>
  )
}
