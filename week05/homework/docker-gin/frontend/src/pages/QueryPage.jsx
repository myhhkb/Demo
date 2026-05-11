import { useState } from 'react'
import { queryWord, saveWord } from '../api'

export default function QueryPage() {
  const [word, setWord] = useState('')
  const [aiProvider, setAiProvider] = useState('qwen')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleQuery = async (e) => {
    e.preventDefault()
    if (!word.trim()) return

    setLoading(true)
    setMessage({ type: '', text: '' })
    setResult(null)

    try {
      const res = await queryWord(word.trim(), aiProvider)
      setResult(res.data.data)
      if (res.data.data.saved) {
        setMessage({ type: 'success', text: '该单词已在你的单词本中' })
      }
    } catch (err) {
      const msg = err.response?.data?.message || '查询失败，请重试'
      setMessage({ type: 'error', text: msg })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!result || result.saved) return

    setSaving(true)
    try {
      const examples = Array.isArray(result.examples)
        ? result.examples
        : JSON.parse(result.examples)

      await saveWord({
        word: result.word,
        definition: result.definition,
        examples: examples,
        ai_provider: result.ai_provider,
      })
      setResult({ ...result, saved: true })
      setMessage({ type: 'success', text: '单词已保存到你的单词本' })
    } catch (err) {
      const msg = err.response?.data?.message || '保存失败，请重试'
      setMessage({ type: 'error', text: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: 20, color: '#2d3436' }}>查询单词</h2>

      <form onSubmit={handleQuery}>
        <div className="search-row">
          <div className="input-group">
            <label>英语单词</label>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="输入要查询的英语单词..."
              required
            />
          </div>
          <div className="input-group select-group">
            <label>AI 模型</label>
            <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
              <option value="qwen">通义千问</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>
          <button className="btn btn-primary" disabled={loading} style={{ marginBottom: 0, height: 46 }}>
            {loading && <span className="loading-spinner" />}
            {loading ? '查询中...' : '查询'}
          </button>
        </div>
      </form>

      {message.text && (
        <div className={`message ${message.type}`} style={{ marginTop: 16 }}>{message.text}</div>
      )}

      {result && (
        <div className="word-result">
          <h2>{result.word}</h2>
          <div className="definition">{result.definition}</div>
          <h3 style={{ marginBottom: 12, color: '#636e72' }}>例句</h3>
          <ul className="examples">
            {(Array.isArray(result.examples) ? result.examples : JSON.parse(result.examples)).map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
          <div className="actions">
            {!result.saved && (
              <button className="btn btn-success" onClick={handleSave} disabled={saving}>
                {saving && <span className="loading-spinner" />}
                {saving ? '保存中...' : '保存到单词本'}
              </button>
            )}
            {result.saved && (
              <span style={{ color: '#2ed573', fontWeight: 600, padding: '10px 0' }}>
                已保存到单词本
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
