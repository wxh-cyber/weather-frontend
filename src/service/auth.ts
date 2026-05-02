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

export interface LoginRecord {
  recordId: string
  account: string
  loginTime: string
  loginAddress: string
  loginDevice: string
}

export interface LoginRecordsResponse {
  code: number
  message: string
  data: LoginRecord[]
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

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface DestroyAccountPayload {
  refreshToken?: string
}

export interface AvatarUploadResponse {
  code: number
  message: string
  data: {
    avatarUrl: string
  }
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

export const getLoginRecords = () => {
  return http.get<never, LoginRecordsResponse>('/auth/login-records')
}

export const updateProfile = (payload: UpdateProfilePayload) => {
  return http.put<UpdateProfilePayload, ProfileResponse>('/auth/profile', payload)
}

export const changePassword = (payload: ChangePasswordPayload) => {
  return http.put<ChangePasswordPayload, { code: number; message: string; data: null }>(
    '/auth/password',
    payload,
  )
}

export const destroyAccount = (payload: DestroyAccountPayload = {}) => {
  return http.post<DestroyAccountPayload, { code: number; message: string; data: null }>(
    '/auth/destroy',
    payload,
  )
}

export const uploadAvatar = (file: File) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return http.post<FormData, AvatarUploadResponse>('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
