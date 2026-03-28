import './QuestionCard.css'

function QuestionCard({ question, selectedAnswer, onAnswer, answered, timeExpired }) {
  const getOptionStatus = (optionId) => {
    if (!answered && !timeExpired) return 'normal'

    if (optionId === question.correct) {
      return 'correct'
    }

    if (selectedAnswer === optionId && optionId !== question.correct) {
      return 'wrong'
    }

    return 'normal'
  }

  const isOptionDisabled = (optionId) => {
    return answered || timeExpired
  }

  return (
    <div className="question-card">
      <h2 className="question-text">{question.id}. {question.question}</h2>

      <div className="options-container">
        {question.options.map(option => {
          const status = getOptionStatus(option.id)
          const isSelected = selectedAnswer === option.id
          const isDisabled = isOptionDisabled(option.id)

          return (
            <button
              key={option.id}
              className={`option-button ${status} ${isSelected ? 'selected' : ''}`}
              onClick={() => onAnswer(option.id)}
              disabled={isDisabled}
            >
              <span className="option-image">{option.image}</span>
              <span className="option-text">{option.text}</span>
              {status === 'correct' && <span className="icon icon-correct">✓</span>}
              {status === 'wrong' && <span className="icon icon-wrong">✕</span>}
            </button>
          )
        })}
      </div>

      {timeExpired && !answered && (
        <div className="timeout-message">
          <p>⏱️ 时间已到，正确答案已显示</p>
        </div>
      )}
    </div>
  )
}

export default QuestionCard
