import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import AppLayout from '@/layout/AppLayout.vue'
import { useCityStore } from '@/store/city'
import { createCity, deleteCity, getCityList, updateCity } from '@/service/city'

const pushMock = vi.fn()
const warningMock = vi.fn()
const successMock = vi.fn()
const routeState = {
  name: 'center',
  fullPath: '/center',
  meta: { navVariant: 'home' },
}

vi.mock('@/service/city', () => ({
  getCityList: vi.fn(),
  createCity: vi.fn(),
  updateCity: vi.fn(),
  deleteCity: vi.fn(),
}))

vi.mock('vue-router', () => ({
  RouterView: {
    template: '<div class="router-view-stub" />',
  },
  useRoute: () => routeState,
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('@/service/auth', () => ({
  getProfile: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: successMock,
    warning: warningMock,
  },
}))

const mockedGetCityList = vi.mocked(getCityList)
const mockedCreateCity = vi.mocked(createCity)
const mockedUpdateCity = vi.mocked(updateCity)
const mockedDeleteCity = vi.mocked(deleteCity)

const AppTopNavStub = {
  name: 'AppTopNav',
  props: [
    'showCenterSearch',
    'showMyCities',
    'showProfileCenter',
    'showLoginList',
    'centerNavCentered',
    'activeCenterAction',
    'loginLabel',
    'avatarUrl',
    'showLogout',
  ],
  emits: ['profile-center-click', 'login-list-click', 'search-submit'],
  template: `
    <div>
      <span class="show-center-search">{{ showCenterSearch }}</span>
      <span class="show-my-cities">{{ showMyCities }}</span>
      <span class="show-profile-center">{{ showProfileCenter }}</span>
      <span class="show-login-list">{{ showLoginList }}</span>
      <span class="center-nav-centered">{{ centerNavCentered }}</span>
      <span class="active-center-action">{{ activeCenterAction }}</span>
      <button class="profile-center-trigger" @click="$emit('profile-center-click')" />
      <button class="login-list-trigger" @click="$emit('login-list-click')" />
    </div>
  `,
}

const ElDialogStub = {
  name: 'ElDialog',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <div v-if="modelValue" class="el-dialog-stub">
      <slot name="header" />
      <slot />
      <slot name="footer" />
    </div>
  `,
}

describe('AppLayout center actions', () => {
  beforeEach(() => {
    pushMock.mockReset()
    warningMock.mockReset()
    successMock.mockReset()
    mockedGetCityList.mockReset()
    mockedCreateCity.mockReset()
    mockedUpdateCity.mockReset()
    mockedDeleteCity.mockReset()
    routeState.name = 'center'
    routeState.fullPath = '/center'
    routeState.meta = { navVariant: 'home' }
  })

  const mountLayout = async (routeName = routeState.name, routeFullPath = routeState.fullPath) => {
    routeState.name = routeName
    routeState.fullPath = routeFullPath
    routeState.meta = { navVariant: 'home' }

    const pinia = createPinia()
    const wrapper = mount(AppLayout, {
      global: {
        plugins: [pinia],
        stubs: {
          AppTopNav: AppTopNavStub,
          CyberCursorOverlay: true,
          'el-dialog': ElDialogStub,
        },
      },
    })

    await flushPromises()

    return { wrapper, pinia }
  }

  it('navigates to center when top nav emits profile-center-click', async () => {
    const { wrapper } = await mountLayout('center', '/center')

    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.show-center-search').text()).toBe('false')
    expect(wrapper.find('.center-nav-centered').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('profile-center')

    await wrapper.find('.profile-center-trigger').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/center')

    pushMock.mockReset()

    await wrapper.find('.login-list-trigger').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/login-list')
  })

  it('shows center modules and search together on weather route', async () => {
    const { wrapper } = await mountLayout('weather', '/weather')

    expect(wrapper.find('.show-center-search').text()).toBe('true')
    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.center-nav-centered').text()).toBe('false')
    expect(wrapper.find('.active-center-action').text()).toBe('')
  })

  it('hides search and keeps center nav centered on my cities route', async () => {
    const { wrapper } = await mountLayout('list', '/list')

    expect(wrapper.find('.show-center-search').text()).toBe('false')
    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.center-nav-centered').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('my-cities')
  })

  it('hides search and keeps center nav centered on login list route', async () => {
    const { wrapper } = await mountLayout('login-list', '/login-list')

    expect(wrapper.find('.show-center-search').text()).toBe('false')
    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.center-nav-centered').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('login-list')
  })

  it('jumps directly when weather search hits current city list', async () => {
    const { wrapper, pinia } = await mountLayout('weather', '/weather')
    const cityStore = useCityStore(pinia)
    cityStore.setCities([{ cityName: '武汉市', weatherText: '晴', temperature: '26°C' }])

    await wrapper.findComponent(AppTopNavStub).vm.$emit('search-submit', '武汉')
    await flushPromises()

    expect(pushMock).toHaveBeenCalledWith('/weather/%E6%AD%A6%E6%B1%89%E5%B8%82')
    expect(wrapper.find('.el-dialog-stub').exists()).toBe(false)
    expect(mockedGetCityList).not.toHaveBeenCalled()
  })

  it('opens confirm dialog for unique backend candidate and adds city after confirm', async () => {
    const { wrapper, pinia } = await mountLayout('weather', '/weather')
    const cityStore = useCityStore(pinia)
    cityStore.setCities([{ cityName: '上海市', weatherText: '多云', temperature: '22°C' }])
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [{ cityName: '武汉市', weatherText: '晴', temperature: '26°C' }],
    })
    vi.spyOn(cityStore, 'createCityByName').mockResolvedValue(true)

    await wrapper.findComponent(AppTopNavStub).vm.$emit('search-submit', '武汉')
    await flushPromises()

    expect(wrapper.find('.el-dialog-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('武汉市')

    const confirmButton = wrapper.findAll('button').find((button) => button.text() === '确认添加')
    await confirmButton?.trigger('click')
    await flushPromises()

    expect(cityStore.createCityByName).toHaveBeenCalledWith('武汉市')
    expect(pushMock).toHaveBeenCalledWith('/weather/%E6%AD%A6%E6%B1%89%E5%B8%82')
  })

  it('warns when weather search matches multiple backend candidates', async () => {
    const { wrapper, pinia } = await mountLayout('weather', '/weather')
    const cityStore = useCityStore(pinia)
    cityStore.setCities([{ cityName: '上海市', weatherText: '多云', temperature: '22°C' }])
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [
        { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
        { cityName: '武汉新区', weatherText: '阴', temperature: '24°C' },
      ],
    })

    await wrapper.findComponent(AppTopNavStub).vm.$emit('search-submit', '武')
    await flushPromises()

    expect(warningMock).toHaveBeenCalledWith('请输入更完整的城市名称')
    expect(wrapper.find('.el-dialog-stub').exists()).toBe(false)
  })

  it('opens confirm dialog with raw input when no backend candidate is found', async () => {
    const { wrapper, pinia } = await mountLayout('weather', '/weather')
    const cityStore = useCityStore(pinia)
    cityStore.setCities([{ cityName: '上海市', weatherText: '多云', temperature: '22°C' }])
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [],
    })
    vi.spyOn(cityStore, 'createCityByName').mockResolvedValue(true)

    await wrapper.findComponent(AppTopNavStub).vm.$emit('search-submit', '  洪山区 ')
    await flushPromises()

    expect(wrapper.find('.el-dialog-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('洪山区')

    const confirmButton = wrapper.findAll('button').find((button) => button.text() === '确认添加')
    await confirmButton?.trigger('click')
    await flushPromises()

    expect(cityStore.createCityByName).toHaveBeenCalledWith('洪山区')
    expect(pushMock).toHaveBeenCalledWith('/weather/%E6%B4%AA%E5%B1%B1%E5%8C%BA')
  })
})
