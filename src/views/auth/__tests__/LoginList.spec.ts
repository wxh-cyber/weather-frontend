import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import LoginList from '@/views/auth/LoginList.vue'
import { getLoginRecords } from '@/service/auth'

vi.mock('@/service/auth', () => ({
  getLoginRecords: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
  },
}))

const mockedGetLoginRecords = vi.mocked(getLoginRecords)

const ElButtonStub = {
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>',
}

const ElEmptyStub = {
  props: ['description'],
  template: '<div class="el-empty-stub">{{ description }}</div>',
}

const ElTableStub = {
  props: ['data'],
  template: `
    <div class="el-table-stub">
      <div v-for="item in data" :key="item.recordId" class="table-row">
        <span>{{ item.account }}</span>
        <span>{{ item.loginTime }}</span>
        <span>{{ item.loginAddress }}</span>
        <span>{{ item.loginDevice }}</span>
      </div>
      <slot />
    </div>
  `,
}

const ElTableColumnStub = {
  template: '<div class="el-table-column-stub" />',
}

describe('LoginList', () => {
  beforeEach(() => {
    mockedGetLoginRecords.mockReset()
  })

  const mountLoginList = async () => {
    const wrapper = mount(LoginList, {
      global: {
        stubs: {
          'el-button': ElButtonStub,
          'el-empty': ElEmptyStub,
          'el-table': ElTableStub,
          'el-table-column': ElTableColumnStub,
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('renders fetched login records', async () => {
    mockedGetLoginRecords.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [
        {
          recordId: 'r-1',
          account: 'demo@weather.com',
          loginTime: '2026-04-07T10:15:00.000Z',
          loginAddress: '上海 / 本地网络',
          loginDevice: 'Chrome 135 / Windows 11',
        },
      ],
    })

    const wrapper = await mountLoginList()

    expect(wrapper.text()).toContain('登录列表')
    expect(wrapper.text()).toContain('demo@weather.com')
    expect(wrapper.text()).toContain('上海 / 本地网络')
    expect(wrapper.text()).toContain('Chrome 135 / Windows 11')
  })

  it('renders empty state when there are no records', async () => {
    mockedGetLoginRecords.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [],
    })

    const wrapper = await mountLoginList()

    expect(wrapper.text()).toContain('当前账号暂未生成登录记录')
  })

  it('renders error state when request fails', async () => {
    mockedGetLoginRecords.mockRejectedValue(new Error('加载失败'))

    const wrapper = await mountLoginList()

    expect(wrapper.text()).toContain('信号异常')
    expect(wrapper.text()).toContain('加载失败')
    expect(wrapper.text()).toContain('重新加载')
  })

  it('renders unauthorized state when session is invalid', async () => {
    mockedGetLoginRecords.mockRejectedValue(new Error('UNAUTHORIZED'))

    const wrapper = await mountLoginList()

    expect(wrapper.text()).toContain('访问受限')
    expect(wrapper.text()).toContain('登录状态已失效，请重新登录')
  })
})
