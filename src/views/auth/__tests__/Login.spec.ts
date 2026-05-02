import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import Login from '@/views/auth/Login.vue'
import { getProfile, login } from '@/service/auth'

const {
  pushMock,
  replaceMock,
  routeMock,
  successMock,
  errorMock,
  warningMock,
  setAuthMock,
  updateUserProfileMock,
  syncFromStorageMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  routeMock: {
    query: {},
    path: '/login',
  },
  successMock: vi.fn(),
  errorMock: vi.fn(),
  warningMock: vi.fn(),
  setAuthMock: vi.fn(),
  updateUserProfileMock: vi.fn(),
  syncFromStorageMock: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}))

vi.mock('@/service/auth', () => ({
  login: vi.fn(),
  getProfile: vi.fn(),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    setAuth: setAuthMock,
    updateUserProfile: updateUserProfileMock,
  }),
}))

vi.mock('@/store/city', () => ({
  useCityStore: () => ({
    syncFromStorage: syncFromStorageMock,
  }),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: successMock,
    error: errorMock,
    warning: warningMock,
  },
}))

const mockedLogin = vi.mocked(login)
const mockedGetProfile = vi.mocked(getProfile)
const rememberedCredentialsStorageKey = 'weather-login-remembered-credentials'

const ElInputStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  `,
}

const ElCheckboxStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <label>
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <slot />
    </label>
  `,
}

const ElButtonStub = {
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>',
}

const ElFormStub = defineComponent({
  setup(_, { expose }) {
    expose({
      validate: vi.fn().mockResolvedValue(true),
    })

    return {}
  },
  template: '<form><slot /></form>',
})

const ElFormItemStub = {
  template: '<div><slot /><slot name="label" /></div>',
}

describe('Login view', () => {
  beforeEach(() => {
    mockedLogin.mockReset()
    mockedGetProfile.mockReset()
    pushMock.mockReset()
    replaceMock.mockReset()
    successMock.mockReset()
    errorMock.mockReset()
    warningMock.mockReset()
    setAuthMock.mockReset()
    updateUserProfileMock.mockReset()
    syncFromStorageMock.mockReset()
    routeMock.query = {}
    window.localStorage.clear()
  })

  const mountLogin = () =>
    mount(Login, {
      global: {
        stubs: {
          'el-form': ElFormStub,
          'el-form-item': ElFormItemStub,
          'el-input': ElInputStub,
          'el-checkbox': ElCheckboxStub,
          'el-button': ElButtonStub,
          'el-icon': true,
          'router-link': true,
        },
      },
    })

  it('restores remembered credentials on mount', async () => {
    window.localStorage.setItem(
      rememberedCredentialsStorageKey,
      JSON.stringify({
        email: 'saved@weather.com',
        password: 'saved-password',
      }),
    )

    const wrapper = mountLogin()
    await flushPromises()

    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(3)
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('saved@weather.com')
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('saved-password')
    expect((inputs[2]!.element as HTMLInputElement).checked).toBe(true)
  })

  it('ignores invalid remembered credentials payload', async () => {
    window.localStorage.setItem(rememberedCredentialsStorageKey, '{invalid-json')

    const wrapper = mountLogin()
    await flushPromises()

    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(3)
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('')
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('')
    expect((inputs[2]!.element as HTMLInputElement).checked).toBe(false)
  })

  it('shows unregistered account message from backend', async () => {
    mockedLogin.mockRejectedValue(new Error('账号未注册'))
    const wrapper = mountLogin()

    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(3)
    await inputs[0]!.setValue('missing@weather.com')
    await inputs[1]!.setValue('123456')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(errorMock).toHaveBeenCalledWith('账号未注册')
  })

  it('shows wrong password message from backend', async () => {
    mockedLogin.mockRejectedValue(new Error('密码错误'))
    const wrapper = mountLogin()

    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(3)
    await inputs[0]!.setValue('demo@weather.com')
    await inputs[1]!.setValue('wrong-password')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(errorMock).toHaveBeenCalledWith('密码错误')
  })

  it('persists credentials after successful login when remember me is checked', async () => {
    mockedLogin.mockResolvedValue({
      code: 0,
      message: '登录成功',
      data: {
        token: 'token-remember',
        user: {
          userId: 'u-remember',
          email: 'remember@weather.com',
          nickname: '记住用户',
        },
      },
    })
    mockedGetProfile.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: {
        userId: 'u-remember',
        email: 'remember@weather.com',
        nickname: '记住用户',
        phone: '',
        qq: '',
        wechat: '',
        avatarUrl: '',
      },
    })

    const wrapper = mountLogin()
    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('remember@weather.com')
    await inputs[1]!.setValue('secure-password')
    const rememberInput = inputs[2]
    expect(rememberInput).toBeTruthy()
    ;(rememberInput!.element as HTMLInputElement).checked = true
    await rememberInput!.trigger('change')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(window.localStorage.getItem(rememberedCredentialsStorageKey)).toBe(
      JSON.stringify({
        email: 'remember@weather.com',
        password: 'secure-password',
      }),
    )
  })

  it('clears remembered credentials after successful login when remember me is unchecked', async () => {
    mockedLogin.mockResolvedValue({
      code: 0,
      message: '登录成功',
      data: {
        token: 'token-clear',
        user: {
          userId: 'u-clear',
          email: 'clear@weather.com',
          nickname: '清除用户',
        },
      },
    })
    mockedGetProfile.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: {
        userId: 'u-clear',
        email: 'clear@weather.com',
        nickname: '清除用户',
        phone: '',
        qq: '',
        wechat: '',
        avatarUrl: '',
      },
    })

    const wrapper = mountLogin()
    window.localStorage.setItem(
      rememberedCredentialsStorageKey,
      JSON.stringify({
        email: 'old@weather.com',
        password: 'old-password',
      }),
    )
    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('clear@weather.com')
    await inputs[1]!.setValue('new-password')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(window.localStorage.getItem(rememberedCredentialsStorageKey)).toBeNull()
  })

  it('syncs profile after login success and updates avatar info', async () => {
    mockedLogin.mockResolvedValue({
      code: 0,
      message: '登录成功',
      data: {
        token: 'token-1',
        user: {
          userId: 'u-1',
          email: 'demo@weather.com',
          nickname: '演示用户',
        },
      },
    })
    mockedGetProfile.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: {
        userId: 'u-1',
        email: 'demo@weather.com',
        nickname: '演示用户',
        phone: '',
        qq: '',
        wechat: '',
        avatarUrl: 'http://localhost:3000/uploads/avatars/demo.png',
      },
    })

    const wrapper = mountLogin()
    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('demo@weather.com')
    await inputs[1]!.setValue('123456')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(setAuthMock).toHaveBeenCalledWith('token-1', {
      userId: 'u-1',
      email: 'demo@weather.com',
      nickname: '演示用户',
    })
    expect(syncFromStorageMock).toHaveBeenCalledTimes(1)
    expect(mockedGetProfile).toHaveBeenCalledTimes(1)
    expect(updateUserProfileMock).toHaveBeenCalledWith({
      userId: 'u-1',
      email: 'demo@weather.com',
      nickname: '演示用户',
      phone: '',
      qq: '',
      wechat: '',
      avatarUrl: 'http://localhost:3000/uploads/avatars/demo.png',
    })
    expect(successMock).toHaveBeenCalledWith('登录成功')
    expect(pushMock).toHaveBeenCalledWith('/weather')
  })

  it('keeps login success flow when profile sync fails', async () => {
    mockedLogin.mockResolvedValue({
      code: 0,
      message: '登录成功',
      data: {
        token: 'token-2',
        user: {
          userId: 'u-2',
          email: 'fallback@weather.com',
          nickname: '备用用户',
        },
      },
    })
    mockedGetProfile.mockRejectedValue(new Error('获取资料失败'))

    const wrapper = mountLogin()
    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('fallback@weather.com')
    await inputs[1]!.setValue('123456')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(setAuthMock).toHaveBeenCalledWith('token-2', {
      userId: 'u-2',
      email: 'fallback@weather.com',
      nickname: '备用用户',
    })
    expect(syncFromStorageMock).toHaveBeenCalledTimes(1)
    expect(mockedGetProfile).toHaveBeenCalledTimes(1)
    expect(updateUserProfileMock).not.toHaveBeenCalled()
    expect(successMock).toHaveBeenCalledWith('登录成功')
    expect(pushMock).toHaveBeenCalledWith('/weather')
    expect(errorMock).not.toHaveBeenCalled()
  })
})
