import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import Home from '@/views/weather/Home.vue'
import { getCityList } from '@/service/city'

vi.mock('@/service/city', () => ({
  getCityList: vi.fn(),
  createCity: vi.fn(),
  updateCity: vi.fn(),
  deleteCity: vi.fn(),
}))

const mockedGetCityList = vi.mocked(getCityList)

describe('Home view', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
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
            template: '<div class="weather-city-overview-stub">WeatherCityOverview</div>',
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
      data: [{ cityName: '武汉市', weatherText: '晴', temperature: '26°C' }],
    })

    const wrapper = await mountHome()

    expect(wrapper.find('.weather-city-overview-stub').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('当前城市列表中还没有任何城市')
    expect(wrapper.find('.weather-empty-state').exists()).toBe(false)
  })
})
