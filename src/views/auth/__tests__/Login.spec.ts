import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import Login from '@/views/auth/Login.vue'
import { login } from '@/service/auth'

const {
  pushMock,
  replaceMock,
  routeMock,
  successMock,
  errorMock,
  warningMock,
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
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    setAuth: vi.fn(),
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
    pushMock.mockReset()
    replaceMock.mockReset()
    successMock.mockReset()
    errorMock.mockReset()
    warningMock.mockReset()
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
})
