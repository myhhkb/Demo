import axios from 'axios'

// 统一的 Axios 实例，所有接口都通过这里请求后端。
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器：如果本地有 token，就自动带上 Authorization 头。
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：如果后端返回 401，说明 token 失效或未登录，直接清理并跳回登录页。
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// 注册接口。
export function register(username, password) {
  return api.post('/register', { username, password })
}

// 登录接口。
export function login(username, password) {
  return api.post('/login', { username, password })
}

// 查询单词接口。
export function queryWord(word, ai_provider) {
  return api.post('/word/query', { word, ai_provider })
}

// 保存单词接口。
export function saveWord(data) {
  return api.post('/word/save', data)
}

// 获取当前用户的单词列表。
export function getWords(page = 1, page_size = 10) {
  return api.get('/words', { params: { page, page_size } })
}

// 删除单词。
export function deleteWord(id) {
  return api.delete(`/word/${id}`)
}

export default api
