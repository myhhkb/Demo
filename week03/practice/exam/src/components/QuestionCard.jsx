import './QuestionCard.css'

// QuestionCard 负责显示当前题目和所有选项。
// 它本身不保存答案状态，而是通过 props 接收外部数据。
function QuestionCard({ question, selectedAnswer, onAnswer, answered, timeExpired }) {
  // 根据当前选项的 id，计算它应该显示成什么状态。
  // 可能的状态有：
  // - normal：普通状态
  // - correct：正确答案
  // - wrong：用户选错的答案
  const getOptionStatus = (optionId) => {
    // 如果题目还没作答，且时间也没到，那么所有选项都保持默认外观。
    if (!answered && !timeExpired) return 'normal'

    // 正确答案始终高亮为 correct。
    if (optionId === question.correct) {
      return 'correct'
    }

    // 如果用户选中了错误答案，则显示 wrong。
    if (selectedAnswer === optionId && optionId !== question.correct) {
      return 'wrong'
    }

    return 'normal'
  }

  // 判断选项是否应该被禁用。
  // 一旦答过题，或者时间耗尽，就不能继续点击选项了。
  const isOptionDisabled = () => {
    return answered || timeExpired
  }

  return (
    <div className="question-card">
      {/* 显示题号和题干 */}
      <h2 className="question-text">{question.id}. {question.question}</h2>

      <div className="options-container">
        {question.options.map(option => {
          const status = getOptionStatus(option.id)
          const isSelected = selectedAnswer === option.id
          const isDisabled = isOptionDisabled()

          return (
            <button
              key={option.id}
              className={`option-button ${status} ${isSelected ? 'selected' : ''}`}
              onClick={() => onAnswer(option.id)}
              disabled={isDisabled}
            >
              {/* 左侧 emoji 图标 */}
              <span className="option-image">{option.image}</span>

              {/* 选项文字 */}
              <span className="option-text">{option.text}</span>

              {/* 如果答案正确或错误，显示对应标记 */}
              {status === 'correct' && <span className="icon icon-correct">✓</span>}
              {status === 'wrong' && <span className="icon icon-wrong">✕</span>}
            </button>
          )
        })}
      </div>

      {/* 时间到了但用户还没答题时，显示超时提示 */}
      {timeExpired && !answered && (
        <div className="timeout-message">
          <p>⏱️ 时间已到，正确答案已显示</p>
        </div>
      )}
    </div>
  )
}

export default QuestionCard
