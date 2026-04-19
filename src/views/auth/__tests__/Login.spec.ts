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

vi.mock('element-plus', () => ({
  ElMessage: {
    success: successMock,
    error: errorMock,
    warning: warningMock,
  },
}))

const mockedLogin = vi.mocked(login)
const mockedGetProfile = vi.mocked(getProfile)

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
    routeMock.query = {}
  })

  const mountLogin = () =>
    mount(Login, {
      global: {
        stubs: {
          'el-form': ElFormStub,
          'el-form-item': ElFormItemStub,
          'el-input': ElInputStub,
          'el-button': ElButtonStub,
          'el-icon': true,
          'router-link': true,
        },
      },
    })

  it('shows unregistered account message from backend', async () => {
    mockedLogin.mockRejectedValue(new Error('账号未注册'))
    const wrapper = mountLogin()

    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(2)
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
    expect(inputs).toHaveLength(2)
    await inputs[0]!.setValue('demo@weather.com')
    await inputs[1]!.setValue('wrong-password')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(errorMock).toHaveBeenCalledWith('密码错误')
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
    expect(mockedGetProfile).toHaveBeenCalledTimes(1)
    expect(updateUserProfileMock).not.toHaveBeenCalled()
    expect(successMock).toHaveBeenCalledWith('登录成功')
    expect(pushMock).toHaveBeenCalledWith('/weather')
    expect(errorMock).not.toHaveBeenCalled()
  })
})
