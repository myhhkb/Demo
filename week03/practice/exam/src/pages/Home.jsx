import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

// Home 是考试应用的首页组件。
// 用户会先在这里点击“开始考试”，然后查看考试须知。
function Home() {
  const navigate = useNavigate()

  // showNotice 控制是否显示“考试须知”弹层内容。
  const [showNotice, setShowNotice] = useState(false)

  // 点击“开始考试”后，先展示考试须知。
  const handleStart = () => {
    setShowNotice(true)
  }

  // 点击“继续考试”后，跳转到正式答题页。
  const handleContinue = () => {
    navigate('/exam')
  }

  // 点击“退出考试”后，回到首页初始状态。
  const handleExit = () => {
    setShowNotice(false)
  }

  // 如果还没有显示考试须知，就先显示欢迎卡片。
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

  // 如果 showNotice 为 true，就显示考试须知界面。
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
