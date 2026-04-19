import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { weatherSearchSubmitKey } from '@/layout/helpers/weatherSearch'
import CityWeatherMapView from '@/views/weather/map/CityWeatherMapView.vue'
import { useCityStore } from '@/store/city'

describe('CityWeatherMapView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const mountMapView = async (initialPath = '/weather/武汉市/map') => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/weather/:cityName', name: 'city-detail', component: { template: '<div />' } },
        { path: '/weather/:cityName/temperature-trend', name: 'city-temperature-trend', component: { template: '<div />' } },
        { path: '/weather/:cityName/map', name: 'city-weather-map', component: CityWeatherMapView },
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
})
