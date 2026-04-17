import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { questions } from '../data/questions'
import QuestionCard from '../components/QuestionCard'
import './Exam.css'

// Exam 是正式答题页面。
// 这个组件负责：
// - 记录当前做到第几题
// - 保存用户答案
// - 管理倒计时
// - 切换下一题
// - 在最后跳转到结果页
function Exam() {
  const navigate = useNavigate()

  // currentIndex：当前题目的下标。
  // 因为数组从 0 开始，所以 0 表示第一题。
  const [currentIndex, setCurrentIndex] = useState(0)

  // answers：保存所有题目的作答结果。
  // 结构类似：{ 1: 'a', 2: 'c' }
  const [answers, setAnswers] = useState({})

  // timeLeft：当前题目剩余秒数。
  const [timeLeft, setTimeLeft] = useState(15)

  // answered：当前题是否已经作答。
  const [answered, setAnswered] = useState(false)

  // timeExpired：当前题是否已经超时。
  const [timeExpired, setTimeExpired] = useState(false)

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length

  // 倒计时逻辑：每隔 1 秒让剩余时间减 1。
  useEffect(() => {
    // 如果已经超时，就不再继续创建计时器。
    if (timeExpired) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        // 当剩余时间减到 0 时，标记为超时。
        if (prev <= 1) {
          setTimeExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // 组件卸载或依赖变化时，清除旧定时器，避免重复计时。
    return () => clearInterval(timer)
  }, [timeExpired])

  // 当题目切换时，要把这一题的状态重置。
  useEffect(() => {
    setTimeLeft(15)
    setAnswered(false)
    setTimeExpired(false)
  }, [currentIndex])

  // handleAnswer 在用户点击某个选项时执行。
  const handleAnswer = (optionId) => {
    // 如果已经答过了，或者已经超时，就不允许再次作答。
    if (answered || timeExpired) return

    setAnswers({
      ...answers,
      [currentQuestion.id]: optionId
    })

    setAnswered(true)
  }

  // handleNext 负责进入下一题，或者在最后提交考试。
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // 如果已经是最后一题，就跳转到结果页，
      // 并把答案和题库一起传过去。
      navigate('/result', {
        state: {
          answers,
          questions
        }
      })
    }
  }

  // handleExit 允许用户中途退出考试。
  const handleExit = () => {
    if (window.confirm('确定要退出考试吗？')) {
      navigate('/')
    }
  }

  return (
    <div className="exam-container">
      {/* 顶部标题和倒计时 */}
      <div className="exam-header">
        <h1 className="exam-title">考试小应用</h1>
        <div className="timer-box">
          <span className="timer-label">剩余时间</span>
          <span className={`timer-value ${timeLeft <= 5 ? 'danger' : ''}`}>
            {String(timeLeft).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* 进度条：按当前题数计算完成比例 */}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        ></div>
      </div>

      {/* 当前题目内容交给 QuestionCard 组件来显示 */}
      <QuestionCard
        question={currentQuestion}
        selectedAnswer={answers[currentQuestion.id]}
        onAnswer={handleAnswer}
        answered={answered}
        timeExpired={timeExpired}
      />

      {/* 底部操作区 */}
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

      {/* 右上角退出按钮 */}
      <button className="btn-exit" onClick={handleExit}>退出</button>
    </div>
  )
}

export default Exam
