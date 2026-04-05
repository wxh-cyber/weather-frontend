import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 8000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      '请求失败，请稍后重试'
    return Promise.reject(new Error(message))
  },
)

export default http
