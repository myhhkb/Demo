import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { questions } from '../data/questions'
import QuestionCard from '../components/QuestionCard'
import './Exam.css'

function Exam() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(15)
  const [answered, setAnswered] = useState(false)
  const [timeExpired, setTimeExpired] = useState(false)

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length

  // 倒计时逻辑
  useEffect(() => {
    if (timeExpired) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimeExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeExpired])

  // 重置题目状态
  useEffect(() => {
    setTimeLeft(15)
    setAnswered(false)
    setTimeExpired(false)
  }, [currentIndex])

  const handleAnswer = (optionId) => {
    if (answered || timeExpired) return

    setAnswers({
      ...answers,
      [currentQuestion.id]: optionId
    })
    setAnswered(true)
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // 考试结束，跳转到结果页面
      navigate('/result', {
        state: {
          answers,
          questions
        }
      })
    }
  }

  const handleExit = () => {
    if (window.confirm('确定要退出考试吗？')) {
      navigate('/')
    }
  }

  return (
    <div className="exam-container">
      <div className="exam-header">
        <h1 className="exam-title">考试小应用</h1>
        <div className="timer-box">
          <span className="timer-label">剩余时间</span>
          <span className={`timer-value ${timeLeft <= 5 ? 'danger' : ''}`}>
            {String(timeLeft).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        ></div>
      </div>

      <QuestionCard
        question={currentQuestion}
        selectedAnswer={answers[currentQuestion.id]}
        onAnswer={handleAnswer}
        answered={answered}
        timeExpired={timeExpired}
      />

      <div className="exam-footer">
        <span className="progress-text">
          进度: {currentIndex + 1} / {totalQuestions}
        </span>
        <button 
          className="btn btn-next"
          onClick={handleNext}
          disabled={!answered && !timeExpired}
        >
          {currentIndex === totalQuestions - 1 ? '提交考试' : '下一题'}
        </button>
      </div>

      <button className="btn-exit" onClick={handleExit}>退出</button>
    </div>
  )
}

export default Exam
