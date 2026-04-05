import { defineStore } from 'pinia'

export interface AuthUser {
  userId: string
  email: string
  nickname?: string
  phone?: string
  qq?: string
  wechat?: string
  avatarUrl?: string
}

type RegisterStatus = {
  success: boolean
  timestamp: number | null
}

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'
const AUTH_REGISTER_KEY = 'auth_register_status'

const isBrowser = () => typeof window !== 'undefined'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: null as AuthUser | null,
    registerStatus: {
      success: false,
      timestamp: null,
    } as RegisterStatus,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token && state.user),
    displayName: (state) => {
      if (!state.user) return '未登录'
      return state.user.nickname || state.user.email || '已登录'
    },
  },
  actions: {
    setAuth(token: string, user: AuthUser) {
      this.token = token
      this.user = user
      if (isBrowser()) {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
        window.dispatchEvent(new Event('auth-user-updated'))
      }
    },
    setRegisterStatus(success: boolean) {
      this.registerStatus = {
        success,
        timestamp: Date.now(),
      }
      if (isBrowser()) {
        localStorage.setItem(AUTH_REGISTER_KEY, JSON.stringify(this.registerStatus))
      }
    },
    clearAuth() {
      this.token = ''
      this.user = null
      if (isBrowser()) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
        window.dispatchEvent(new Event('auth-user-updated'))
      }
    },
    updateUserProfile(partialUser: Partial<AuthUser>) {
      if (!this.user) {
        return
      }
      this.user = {
        ...this.user,
        ...partialUser,
      }
      if (isBrowser()) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user))
        window.dispatchEvent(new Event('auth-user-updated'))
      }
    },
    syncFromStorage() {
      if (!isBrowser()) {
        return
      }
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      const userRaw = localStorage.getItem(AUTH_USER_KEY)
      const registerRaw = localStorage.getItem(AUTH_REGISTER_KEY)

      this.token = token || ''
      if (userRaw) {
        try {
          this.user = JSON.parse(userRaw) as AuthUser
        } catch {
          this.user = null
        }
      } else {
        this.user = null
      }

      if (registerRaw) {
        try {
          this.registerStatus = JSON.parse(registerRaw) as RegisterStatus
        } catch {
          this.registerStatus = { success: false, timestamp: null }
        }
      } else {
        this.registerStatus = { success: false, timestamp: null }
      }

      if (!this.token || !this.user) {
        this.token = ''
        this.user = null
      }
    },
  },
})
