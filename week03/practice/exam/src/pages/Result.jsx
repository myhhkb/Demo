import { useLocation, useNavigate } from 'react-router-dom'
import './Result.css'

function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const { answers = {}, questions = [] } = location.state || {}

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

  const handleRetry = () => {
    navigate('/exam')
  }

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
