import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import AppLayout from '@/layout/AppLayout.vue'
import { getProfile } from '@/service/auth'
import { useAuthStore } from '@/store/auth'
import { useCityStore } from '@/store/city'
import { buildCityListStorageKey } from '@/store/city'
import { createCity, deleteCity, getCityList, updateCity } from '@/service/city'

const { pushMock, warningMock, successMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  warningMock: vi.fn(),
  successMock: vi.fn(),
}))
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
const mockedGetProfile = vi.mocked(getProfile)

const AppTopNavStub = {
  name: 'AppTopNav',
  props: [
    'showCenterSearch',
    'showCityDetail',
    'showMyCities',
    'showProfileCenter',
    'showLoginList',
    'centerNavCentered',
    'activeCenterAction',
    'loginLabel',
    'avatarUrl',
    'showLogout',
  ],
  emits: ['city-detail-click', 'my-cities-click', 'profile-center-click', 'login-list-click', 'logout-click', 'search-submit'],
  template: `
    <div>
      <span class="show-center-search">{{ showCenterSearch }}</span>
      <span class="show-city-detail">{{ showCityDetail }}</span>
      <span class="show-my-cities">{{ showMyCities }}</span>
      <span class="show-profile-center">{{ showProfileCenter }}</span>
      <span class="show-login-list">{{ showLoginList }}</span>
      <span class="center-nav-centered">{{ centerNavCentered }}</span>
      <span class="active-center-action">{{ activeCenterAction }}</span>
      <span class="login-label">{{ loginLabel }}</span>
      <span class="avatar-url">{{ avatarUrl }}</span>
      <span class="show-logout">{{ showLogout }}</span>
      <button class="city-detail-trigger" @click="$emit('city-detail-click')" />
      <button class="my-cities-trigger" @click="$emit('my-cities-click')" />
      <button class="profile-center-trigger" @click="$emit('profile-center-click')" />
      <button class="login-list-trigger" @click="$emit('login-list-click')" />
      <button class="logout-trigger" @click="$emit('logout-click')" />
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
    mockedGetProfile.mockReset()
    localStorage.clear()
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
    expect(wrapper.find('.show-city-detail').text()).toBe('true')
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

  it('hydrates avatar on first mount when stored auth user misses avatarUrl', async () => {
    localStorage.setItem('auth_token', 'token-1')
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        userId: 'u-1',
        email: 'demo@weather.com',
        nickname: '演示用户',
      }),
    )
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

    const { wrapper } = await mountLayout('weather', '/weather')

    expect(mockedGetProfile).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.avatar-url').text()).toBe('http://localhost:3000/uploads/avatars/demo.png')
    expect(JSON.parse(localStorage.getItem('auth_user') || '{}').avatarUrl).toBe(
      'http://localhost:3000/uploads/avatars/demo.png',
    )
  })

  it('skips profile hydration when stored auth user already has avatarUrl', async () => {
    localStorage.setItem('auth_token', 'token-2')
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        userId: 'u-2',
        email: 'avatar@weather.com',
        nickname: '已有头像用户',
        avatarUrl: 'http://localhost:3000/uploads/avatars/existing.png',
      }),
    )

    const { wrapper } = await mountLayout('weather', '/weather')

    expect(mockedGetProfile).not.toHaveBeenCalled()
    expect(wrapper.find('.avatar-url').text()).toBe('http://localhost:3000/uploads/avatars/existing.png')
  })

  it('keeps page rendered and stored login state when startup hydration fails', async () => {
    localStorage.setItem('auth_token', 'token-3')
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        userId: 'u-3',
        email: 'fallback@weather.com',
        nickname: '容错用户',
      }),
    )
    mockedGetProfile.mockRejectedValue(new Error('获取资料失败'))

    const { wrapper, pinia } = await mountLayout('weather', '/weather')
    const cityStore = useCityStore(pinia)
    cityStore.setCities([{ cityName: '武汉市', weatherText: '晴', temperature: '26°C' }])
    await flushPromises()

    expect(mockedGetProfile).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.show-center-search').text()).toBe('false')
    expect(wrapper.find('.login-label').text()).toBe('容错用户')
    expect(wrapper.find('.avatar-url').text()).toBe('')
    expect(localStorage.getItem('auth_token')).toBe('token-3')
    expect(JSON.parse(localStorage.getItem('auth_user') || '{}').nickname).toBe('容错用户')
  })

  it('navigates to default city detail when top nav emits city-detail-click', async () => {
    localStorage.setItem('auth_token', 'token-city-detail')
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        userId: 'u-city-detail',
        email: 'city-detail@weather.com',
      }),
    )
    const { wrapper, pinia } = await mountLayout('center', '/center')
    const cityStore = useCityStore(pinia)
    cityStore.setCities([{ cityName: '武汉市', weatherText: '晴', temperature: '26°C' }])

    await wrapper.find('.city-detail-trigger').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/weather/%E6%AD%A6%E6%B1%89%E5%B8%82')
  })

  it('falls back to /weather when city-detail-click has no cities available', async () => {
    const { wrapper } = await mountLayout('center', '/center')

    await wrapper.find('.city-detail-trigger').trigger('click')
    await flushPromises()

    expect(pushMock).toHaveBeenCalledWith('/weather')
  })

  it('shows centered route modules and hides search on weather route', async () => {
    const { wrapper, pinia } = await mountLayout('weather', '/weather')
    const cityStore = useCityStore(pinia)
    cityStore.setCities([{ cityName: '武汉市', weatherText: '晴', temperature: '26°C' }])
    await flushPromises()

    expect(wrapper.find('.show-center-search').text()).toBe('false')
    expect(wrapper.find('.show-city-detail').text()).toBe('true')
    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.center-nav-centered').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('')
  })

  it('hides search and centers route modules when weather route has no cities', async () => {
    const { wrapper, pinia } = await mountLayout('weather', '/weather')
    const cityStore = useCityStore(pinia)
    cityStore.setCities([])
    await flushPromises()

    expect(wrapper.find('.show-center-search').text()).toBe('false')
    expect(wrapper.find('.show-city-detail').text()).toBe('true')
    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.center-nav-centered').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('')
  })

  it('shows centered route modules and hides search on city detail route', async () => {
    const { wrapper } = await mountLayout('city-detail', '/weather/%E6%AD%A6%E6%B1%89%E5%B8%82')

    expect(wrapper.find('.show-center-search').text()).toBe('false')
    expect(wrapper.find('.show-city-detail').text()).toBe('true')
    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.center-nav-centered').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('city-detail')
  })

  it('shows centered route modules and hides search on temperature trend route', async () => {
    const { wrapper } = await mountLayout(
      'city-temperature-trend',
      '/weather/%E6%AD%A6%E6%B1%89%E5%B8%82/temperature-trend',
    )

    expect(wrapper.find('.show-center-search').text()).toBe('false')
    expect(wrapper.find('.show-city-detail').text()).toBe('true')
    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.center-nav-centered').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('city-detail')
  })

  it('shows centered route modules and marks city detail group active on map route', async () => {
    const { wrapper } = await mountLayout(
      'city-weather-map',
      '/weather/%E6%AD%A6%E6%B1%89%E5%B8%82/map',
    )

    expect(wrapper.find('.show-center-search').text()).toBe('false')
    expect(wrapper.find('.show-city-detail').text()).toBe('true')
    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.center-nav-centered').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('city-detail')
  })

  it('hides search and keeps center nav centered on my cities route', async () => {
    const { wrapper } = await mountLayout('list', '/list')

    expect(wrapper.find('.show-center-search').text()).toBe('false')
    expect(wrapper.find('.show-city-detail').text()).toBe('true')
    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.center-nav-centered').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('my-cities')
  })

  it('navigates to /login when my cities is clicked while logged out', async () => {
    const { wrapper } = await mountLayout('weather', '/weather')

    await wrapper.find('.my-cities-trigger').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/login')
  })

  it('navigates to /list when my cities is clicked while logged in', async () => {
    localStorage.setItem('auth_token', 'token-my-cities')
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        userId: 'u-my-cities',
        email: 'my-cities@weather.com',
      }),
    )

    const { wrapper } = await mountLayout('weather', '/weather')

    await wrapper.find('.my-cities-trigger').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/list')
  })

  it('hides search and keeps center nav centered on login list route', async () => {
    const { wrapper } = await mountLayout('login-list', '/login-list')

    expect(wrapper.find('.show-center-search').text()).toBe('false')
    expect(wrapper.find('.show-city-detail').text()).toBe('true')
    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.center-nav-centered').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('login-list')
  })

  it('clears auth and city state, then redirects to /weather when logging out', async () => {
    localStorage.setItem('auth_token', 'token-logout')
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        userId: 'u-logout',
        email: 'logout@weather.com',
        nickname: '退出用户',
      }),
    )
    localStorage.setItem(
      buildCityListStorageKey('u-logout'),
      JSON.stringify([{ cityName: '武汉市', weatherText: '晴', temperature: '26°C' }]),
    )

    const { wrapper, pinia } = await mountLayout('center', '/center')
    const authStore = useAuthStore(pinia)
    const cityStore = useCityStore(pinia)

    expect(wrapper.find('.show-logout').text()).toBe('true')

    await wrapper.find('.logout-trigger').trigger('click')
    await flushPromises()

    expect(authStore.isLoggedIn).toBe(false)
    expect(cityStore.cities).toEqual([])
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem(buildCityListStorageKey('u-logout'))).toBeNull()
    expect(successMock).toHaveBeenCalledWith('已退出登录')
    expect(pushMock).toHaveBeenCalledWith('/weather')
    expect(wrapper.find('.show-logout').text()).toBe('false')
  })

  it('navigates to /login when my cities is clicked after logout', async () => {
    localStorage.setItem('auth_token', 'token-after-logout')
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        userId: 'u-after-logout',
        email: 'after-logout@weather.com',
      }),
    )

    const { wrapper } = await mountLayout('weather', '/weather')

    await wrapper.find('.logout-trigger').trigger('click')
    await flushPromises()

    pushMock.mockReset()

    await wrapper.find('.my-cities-trigger').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/login')
  })

  it('hydrates city store from the current logged-in user instead of reusing the previous user cache', async () => {
    localStorage.setItem(
      buildCityListStorageKey('u-1'),
      JSON.stringify([{ cityName: '武汉市', weatherText: '晴', temperature: '26°C' }]),
    )
    localStorage.setItem(
      buildCityListStorageKey('u-2'),
      JSON.stringify([{ cityName: '上海市', weatherText: '多云', temperature: '22°C' }]),
    )
    localStorage.setItem('auth_token', 'token-u-1')
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        userId: 'u-1',
        email: 'user1@weather.com',
        nickname: '用户一',
      }),
    )

    const { pinia } = await mountLayout('weather', '/weather')
    const authStore = useAuthStore(pinia)
    const cityStore = useCityStore(pinia)

    cityStore.syncFromStorage()
    expect(cityStore.cities.map((city) => city.cityName)).toEqual(['武汉市'])

    cityStore.clearPersistedCitiesForUser(authStore.user?.userId ?? '')
    cityStore.clearCities()
    authStore.clearAuth()
    authStore.setAuth('token-u-2', {
      userId: 'u-2',
      email: 'user2@weather.com',
      nickname: '用户二',
    })
    cityStore.syncFromStorage()

    expect(cityStore.cities.map((city) => city.cityName)).toEqual(['上海市'])
    expect(cityStore.cities.map((city) => city.cityName)).not.toContain('武汉市')
  })

  it('jumps directly when weather search hits current city list', async () => {
    localStorage.setItem('auth_token', 'token-search')
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        userId: 'u-search',
        email: 'search@weather.com',
      }),
    )
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

  it('reuses search-and-add flow on city detail route', async () => {
    const { wrapper, pinia } = await mountLayout('city-detail', '/weather/%E4%B8%8A%E6%B5%B7%E5%B8%82')
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

  it('closes dialog without side effects when canceling on city detail route', async () => {
    const { wrapper, pinia } = await mountLayout(
      'city-temperature-trend',
      '/weather/%E4%B8%8A%E6%B5%B7%E5%B8%82/temperature-trend',
    )
    const cityStore = useCityStore(pinia)
    cityStore.setCities([{ cityName: '上海市', weatherText: '多云', temperature: '22°C' }])
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [],
    })
    const createSpy = vi.spyOn(cityStore, 'createCityByName').mockResolvedValue(true)

    await wrapper.findComponent(AppTopNavStub).vm.$emit('search-submit', '杭州')
    await flushPromises()

    expect(wrapper.find('.el-dialog-stub').exists()).toBe(true)

    const cancelButton = wrapper.findAll('button').find((button) => button.text() === '取消')
    await cancelButton?.trigger('click')
    await flushPromises()

    expect(wrapper.find('.el-dialog-stub').exists()).toBe(false)
    expect(createSpy).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })
})
