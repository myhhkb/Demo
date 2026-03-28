import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [showNotice, setShowNotice] = useState(false)

  const handleStart = () => {
    setShowNotice(true)
  }

  const handleContinue = () => {
    navigate('/exam')
  }

  const handleExit = () => {
    setShowNotice(false)
  }

  if (!showNotice) {
    return (
      <div className="home-container">
        <div className="home-card">
          <h1 className="home-title">开始考试</h1>
          <button className="btn btn-primary btn-large" onClick={handleStart}>
            开始考试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="home-container">
      <div className="notice-card">
        <h2 className="notice-title">考试须知</h2>
        <div className="notice-content">
          <p>1. 每一个题目有 <span className="highlight">15 秒</span> 的答题时间。</p>
          <p>2. 一旦选择了答案，则无法取消/修改。</p>
          <p>3. 一旦倒计时结束，则不能选择关于本题的任何选项。</p>
          <p>4. 诚信考试，禁止抄袭。</p>
        </div>
        <div className="button-group">
          <button className="btn btn-secondary" onClick={handleExit}>退出考试</button>
          <button className="btn btn-primary" onClick={handleContinue}>继续考试</button>
        </div>
      </div>
    </div>
  )
}

export default Home
