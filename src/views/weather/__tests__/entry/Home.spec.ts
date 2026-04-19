import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import Home from '@/views/weather/entry/Home.vue'
import { getCityList } from '@/service/city'

const pushMock = vi.fn()

vi.mock('@/service/city', () => ({
  getCityList: vi.fn(),
  createCity: vi.fn(),
  updateCity: vi.fn(),
  deleteCity: vi.fn(),
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRouter: () => ({
      push: pushMock,
    }),
  }
})

const mockedGetCityList = vi.mocked(getCityList)

describe('Home view', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    pushMock.mockReset()
    mockedGetCityList.mockReset()
  })

  const mountHome = async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(Home, {
      global: {
        plugins: [pinia],
        stubs: {
          WeatherPageShell: {
            props: ['cityName', 'weatherText'],
            template:
              '<section class="weather-page-shell-stub" :data-city-name="cityName" :data-weather-text="weatherText"><slot /></section>',
          },
          WeatherCityOverview: {
            name: 'WeatherCityOverview',
            emits: ['nav-select'],
            template: `
              <div class="weather-city-overview-stub">
                WeatherCityOverview
                <button class="to-map" @click="$emit('nav-select', 'weather-map')" />
              </div>
            `,
          },
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('shows cyber empty state when backend returns no cities', async () => {
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [],
    })

    const wrapper = await mountHome()

    expect(wrapper.text()).toContain('当前城市列表中还没有任何城市')
    expect(wrapper.find('.weather-empty-state').exists()).toBe(true)
    expect(wrapper.find('.weather-city-overview-stub').exists()).toBe(false)
  })

  it('renders weather city overview when real city data exists', async () => {
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [{
        cityName: '武汉市',
        province: '湖北省',
        latitude: 30.5928,
        longitude: 114.3055,
        weatherText: '晴',
        temperature: '26°C',
      }],
    })

    const wrapper = await mountHome()

    expect(wrapper.find('.weather-city-overview-stub').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('当前城市列表中还没有任何城市')
    expect(wrapper.find('.weather-empty-state').exists()).toBe(false)
  })

  it('routes to the dedicated map page when selecting weather map nav', async () => {
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [{
        cityName: '武汉市',
        province: '湖北省',
        latitude: 30.5928,
        longitude: 114.3055,
        weatherText: '晴',
        temperature: '26°C',
      }],
    })

    const wrapper = await mountHome()
    await wrapper.find('.to-map').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/weather/%E6%AD%A6%E6%B1%89%E5%B8%82/map')
  })
})
