import { useLocation, useNavigate } from 'react-router-dom'
import './Result.css'

// Result 负责显示考试结束后的得分结果。
function Result() {
  const location = useLocation()
  const navigate = useNavigate()

  // location.state 是从上一页跳转时附带过来的数据。
  // 这里用默认值兜底，避免用户直接访问 /result 时页面报错。
  const { answers = {}, questions = [] } = location.state || {}

  // calculateScore 用来统计用户做对了多少题。
  const calculateScore = () => {
    let correct = 0

    questions.forEach(q => {
      if (answers[q.id] === q.correct) {
        correct++
      }
    })

    return correct
  }

  const score = calculateScore()
  const total = questions.length

  // 重新开始考试：直接跳回考试页。
  const handleRetry = () => {
    navigate('/exam')
  }

  // 退出考试：返回首页。
  const handleExit = () => {
    navigate('/')
  }

  return (
    <div className="result-container">
      <div className="result-card">
        <div className="crown-icon">👑</div>
        <h1 className="result-title">您已完成考试！</h1>
        <p className="result-subtitle">
          很好 😎，你得了 {score} 分，共 {total} 分。
        </p>

        <div className="button-group">
          <button className="btn btn-secondary" onClick={handleExit}>退出考试</button>
          <button className="btn btn-primary" onClick={handleRetry}>重新考试</button>
        </div>
      </div>
    </div>
  )
}

export default Result
