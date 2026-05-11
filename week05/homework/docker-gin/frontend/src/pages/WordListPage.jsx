import { useState, useEffect, useCallback } from 'react'
import { getWords, deleteWord } from '../api'

export default function WordListPage() {
  const [words, setWords] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState(null)

  const fetchWords = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getWords(page, pageSize)
      setWords(res.data.data.list || [])
      setTotal(res.data.data.total)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    fetchWords()
  }, [fetchWords])

  const totalPages = Math.ceil(total / pageSize)

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个单词吗？')) return
    try {
      await deleteWord(id)
      fetchWords()
    } catch {
      alert('删除失败')
    }
  }

  const parseExamples = (examples) => {
    if (Array.isArray(examples)) return examples
    try {
      return JSON.parse(examples)
    } catch {
      return []
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: 20, color: '#2d3436' }}>
        我的单词本
        <span style={{ fontSize: 14, color: '#a4b0be', marginLeft: 12 }}>共 {total} 个单词</span>
      </h2>

      {loading && <p style={{ textAlign: 'center', color: '#a4b0be' }}>加载中...</p>}

      {!loading && words.length === 0 && (
        <div className="empty-state">
          <p>还没有保存任何单词</p>
          <p style={{ fontSize: 14 }}>去「查询单词」页面搜索并保存吧</p>
        </div>
      )}

      {!loading && words.length > 0 && (
        <>
          <table className="word-list-table">
            <thead>
              <tr>
                <th>单词</th>
                <th>释义</th>
                <th>AI 来源</th>
                <th>保存时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w) => (
                <tr key={w.id}>
                  <td>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setDetail(w) }}
                      style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {w.word}
                    </a>
                  </td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.definition}
                  </td>
                  <td>{w.ai_provider}</td>
                  <td>{new Date(w.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handleDelete(w.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </button>
              <span style={{ color: '#636e72' }}>{page} / {totalPages}</span>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {detail && (
        <div className="word-detail-modal" onClick={() => setDetail(null)}>
          <div className="word-detail-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setDetail(null)}>&times;</button>
            <h2>{detail.word}</h2>
            <div className="definition" style={{
              padding: 16, background: '#f8f9fa', borderRadius: 8,
              borderLeft: '4px solid #667eea', marginBottom: 16, lineHeight: 1.6
            }}>
              {detail.definition}
            </div>
            <h3 style={{ marginBottom: 12, color: '#636e72' }}>例句</h3>
            <ul className="examples" style={{ listStyle: 'none', padding: 0 }}>
              {parseExamples(detail.examples).map((ex, i) => (
                <li key={i} style={{
                  padding: '12px 16px', marginBottom: 8,
                  background: '#f0f3ff', borderRadius: 8, lineHeight: 1.5
                }}>
                  {ex}
                </li>
              ))}
            </ul>
            <p style={{ color: '#a4b0be', fontSize: 13, marginTop: 16 }}>
              AI 来源: {detail.ai_provider} | 保存时间: {new Date(detail.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
