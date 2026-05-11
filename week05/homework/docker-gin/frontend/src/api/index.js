import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

export function register(username, password) {
  return api.post('/register', { username, password })
}

export function login(username, password) {
  return api.post('/login', { username, password })
}

export function queryWord(word, ai_provider) {
  return api.post('/word/query', { word, ai_provider })
}

export function saveWord(data) {
  return api.post('/word/save', data)
}

export function getWords(page = 1, page_size = 10) {
  return api.get('/words', { params: { page, page_size } })
}

export function deleteWord(id) {
  return api.delete(`/word/${id}`)
}

export default api
