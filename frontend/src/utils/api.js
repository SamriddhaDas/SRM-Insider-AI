import axios from 'axios'

const BASE = '/api'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('srm_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r.data,
  err => Promise.reject(err.response?.data || err)
)

export default api

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')

// Conversations
export const getConversations = () => api.get('/conversations')
export const createConversation = (title) => api.post('/conversations', { title })
export const deleteConversation = (id) => api.delete(`/conversations/${id}`)
export const getMessages = (convId) => api.get(`/conversations/${convId}/messages`)

// FAQs
export const getFaqs = (category) => api.get('/faqs', { params: category ? { category } : {} })
export const getFaqCategories = () => api.get('/faqs/categories')

// Stats
export const getStats = () => api.get('/stats')

// Feedback
export const sendFeedback = (data) => api.post('/feedback', data)

// Streaming chat — same origin /api/chat
export function streamChat(conversationId, message, onDelta, onDone, onError) {
  const token = localStorage.getItem('srm_token')
  fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ conversation_id: conversationId, message })
  }).then(res => {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    function pump() {
      reader.read().then(({ done, value }) => {
        if (done) { onDone(); return }
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.type === 'delta') onDelta(parsed.text)
            else if (parsed.type === 'done') onDone(parsed.message_id)
            else if (parsed.type === 'error') onError(parsed.error)
          } catch {}
        }
        pump()
      }).catch(onError)
    }
    pump()
  }).catch(onError)
}
