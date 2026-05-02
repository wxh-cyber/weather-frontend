import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { weatherSearchSubmitKey } from '@/layout/helpers/weatherSearch'
import CityWeatherMapView from '@/views/weather/map/CityWeatherMapView.vue'
import { useCityStore } from '@/store/city'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/store/auth'

describe('CityWeatherMapView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const mountMapView = async (initialPath = '/weather/武汉市/map') => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'test-token')
    localStorage.setItem(
      AUTH_USER_KEY,
      JSON.stringify({
        userId: 'test-user',
        email: 'tester@example.com',
      }),
    )

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/weather/:cityName', name: 'city-detail', component: { template: '<div />' } },
        { path: '/weather/:cityName/temperature-trend', name: 'city-temperature-trend', component: { template: '<div />' } },
        { path: '/weather/:cityName/map', name: 'city-weather-map', component: CityWeatherMapView },
        { path: '/weather/:cityName/daily-weather', name: 'city-daily-weather', component: { template: '<div />' } },
      ],
    })

    await router.push(initialPath)
    await router.isReady()

    const pinia = createPinia()
    setActivePinia(pinia)
    const cityStore = useCityStore(pinia)
    cityStore.setCities([
      { cityName: '武汉市', province: '湖北省', latitude: 30.5928, longitude: 114.3055, weatherText: '晴', temperature: '26°C' },
      { cityName: '上海市', province: '上海市', latitude: 31.2304, longitude: 121.4737, weatherText: '多云', temperature: '22°C' },
    ])
    const searchSubmitMock = vi.fn()

    const wrapper = mount(CityWeatherMapView, {
      global: {
        plugins: [pinia, router],
        provide: {
          [weatherSearchSubmitKey]: searchSubmitMock,
        },
        stubs: {
          'el-icon': {
            template: '<i><slot /></i>',
          },
          WeatherDetailHeader: {
            props: ['navItems', 'activeNavKey'],
            emits: ['nav-select', 'search-submit'],
            template: `
              <header class="weather-detail-header-stub">
                <span class="shared-active-nav">{{ activeNavKey }}</span>
                <button
                  v-for="item in navItems"
                  :key="item.key"
                  class="menu-button"
                  @click="$emit('nav-select', item.key)"
                >
                  {{ item.label }}
                </button>
              </header>
            `,
          },
          WeatherCityTabs: {
            template: '<div class="weather-city-tabs-stub" />',
          },
          WeatherMapExplorer: {
            props: ['cityName', 'latitude', 'longitude'],
            template: '<section class="weather-map-explorer-stub" :data-city-name="cityName" :data-latitude="latitude" :data-longitude="longitude" />',
          },
        },
      },
    })

    await flushPromises()
    return { wrapper, router, searchSubmitMock }
  }

  it('renders the dedicated map page with the selected city data', async () => {
    const { wrapper, router } = await mountMapView()

    expect(router.currentRoute.value.name).toBe('city-weather-map')
    expect(wrapper.find('.weather-detail-header-stub').exists()).toBe(true)
    expect(wrapper.find('.shared-active-nav').text()).toBe('weather-map')
    expect(wrapper.find('.weather-map-explorer-stub').exists()).toBe(true)
    expect(wrapper.find('.weather-map-explorer-stub').attributes('data-city-name')).toBe('武汉市')
  })

  it('switches back to overview and trend routes from local nav', async () => {
    const { wrapper, router } = await mountMapView()

    const buttons = wrapper.findAll('.menu-button')
    await buttons[0]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('city-detail')

    await router.push('/weather/武汉市/map')
    await flushPromises()

    const refreshedButtons = wrapper.findAll('.menu-button')
    await refreshedButtons[1]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('city-temperature-trend')
  })

  it('switches to the daily weather route from local nav', async () => {
    const { wrapper, router } = await mountMapView()

    const buttons = wrapper.findAll('.menu-button')
    await buttons[3]!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('city-daily-weather')
  })
})
