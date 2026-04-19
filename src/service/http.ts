import axios from 'axios'
import { getActivePinia } from 'pinia'
import { useAuthStore } from '@/store/auth'
import { clearPersistedCitiesForUserId, useCityStore } from '@/store/city'
import { getStoredAuthUserId } from '@/store/auth'

const getAuthToken = () => {
  const activePinia = getActivePinia()
  if (activePinia) {
    const authStore = useAuthStore(activePinia)
    return authStore.token
  }
  return localStorage.getItem('auth_token')
}

const clearAuthState = () => {
  const storedUserId = getStoredAuthUserId()
  const activePinia = getActivePinia()
  if (activePinia) {
    const cityStore = useCityStore(activePinia)
    const authStore = useAuthStore(activePinia)
    cityStore.clearPersistedCitiesForUser(storedUserId)
    cityStore.clearCities()
    authStore.clearAuth()
    return
  }
  clearPersistedCitiesForUserId(storedUserId)
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-user-updated'))
  }
}

const buildLoginRedirectUrl = (reason: 'expired' | 'unauthorized') => {
  const currentPath =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : '/login-list'
  const query = new URLSearchParams({
    reason,
    redirect: currentPath,
  })
  return `/login?${query.toString()}`
}

const http = axios.create({
  baseURL: '/api',
  timeout: 8000,
})

http.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const statusCode = error?.response?.status
    if (statusCode === 401 && typeof window !== 'undefined') {
      clearAuthState()
      if (window.location.pathname !== '/login') {
        window.location.replace(buildLoginRedirectUrl('expired'))
      }
      return Promise.reject(new Error('UNAUTHORIZED'))
    }

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      '请求失败，请稍后重试'
    return Promise.reject(new Error(message))
  },
)

export default http
