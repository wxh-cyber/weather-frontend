import http from './http'

export interface RegisterPayload {
  email: string
  password: string
  nickname?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterResponse {
  code: number
  message: string
  data: {
    userId: string
    email: string
    nickname?: string
  }
}

export interface LoginResponse {
  code: number
  message: string
  data: {
    token: string
    user: {
      userId: string
      email: string
      nickname?: string
    }
  }
}

export interface ProfileData {
  userId: string
  email: string
  nickname?: string
  phone: string
  qq: string
  wechat: string
  avatarUrl: string
}

export interface ProfileResponse {
  code: number
  message: string
  data: ProfileData
}

export interface UpdateProfilePayload {
  nickname?: string
  phone?: string
  qq?: string
  wechat?: string
  avatarUrl?: string
}

export const register = (payload: RegisterPayload) => {
  return http.post<RegisterPayload, RegisterResponse>('/auth/register', payload)
}

export const login = (payload: LoginPayload) => {
  return http.post<LoginPayload, LoginResponse>('/auth/login', payload)
}

export const getProfile = () => {
  return http.get<never, ProfileResponse>('/auth/profile')
}

export const updateProfile = (payload: UpdateProfilePayload) => {
  return http.put<UpdateProfilePayload, ProfileResponse>('/auth/profile', payload)
}
