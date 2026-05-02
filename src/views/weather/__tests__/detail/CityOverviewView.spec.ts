import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { weatherSearchSubmitKey } from '@/layout/helpers/weatherSearch'
import CityOverviewView from '@/views/weather/detail/CityOverviewView.vue'
import { useCityStore } from '@/store/city'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/store/auth'

describe('CityOverviewView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const mountOverviewView = async (initialPath: string) => {
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
        { path: '/weather/:cityName', name: 'city-detail', component: CityOverviewView },
        { path: '/weather/:cityName/temperature-trend', name: 'city-temperature-trend', component: CityOverviewView },
        { path: '/weather/:cityName/map', name: 'city-weather-map', component: CityOverviewView },
        { path: '/weather/:cityName/daily-weather', name: 'city-daily-weather', component: CityOverviewView },
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

    const wrapper = mount(CityOverviewView, {
      global: {
        plugins: [pinia, router],
        provide: {
          [weatherSearchSubmitKey]: searchSubmitMock,
        },
        stubs: {
          WeatherCityOverview: {
            props: ['selectedCityName', 'temperature', 'weatherText', 'navItems', 'activeNavKey'],
            emits: ['nav-select', 'search-submit'],
            template: `
              <section class="weather-city-overview-stub">
                <span class="selected-city">{{ selectedCityName }}</span>
                <span class="selected-temperature">{{ temperature }}</span>
                <span class="selected-weather">{{ weatherText }}</span>
                <span class="active-nav-key">{{ activeNavKey }}</span>
                <button class="to-overview" @click="$emit('nav-select', 'overview')" />
                <button class="to-trend" @click="$emit('nav-select', 'temperature-trend')" />
                <button class="to-map" @click="$emit('nav-select', 'weather-map')" />
                <button class="to-daily-weather" @click="$emit('nav-select', 'daily-weather')" />
                <button class="submit-search" @click="$emit('search-submit', '南京')" />
              </section>
            `,
          },
        },
      },
    })

    await flushPromises()

    return { wrapper, router, searchSubmitMock }
  }

  it('renders the overview content on the default city detail route', async () => {
    const { wrapper } = await mountOverviewView('/weather/武汉市')

    expect(wrapper.find('.weather-city-overview-stub').exists()).toBe(true)
    expect(wrapper.find('.selected-city').text()).toBe('武汉市')
    expect(wrapper.find('.selected-temperature').text()).toBe('26°C')
  })

  it('keeps the overview content visible on the temperature trend child route', async () => {
    const { wrapper, router } = await mountOverviewView('/weather/武汉市/temperature-trend')

    expect(router.currentRoute.value.name).toBe('city-temperature-trend')
    expect(wrapper.find('.weather-city-overview-stub').exists()).toBe(true)
    expect(wrapper.find('.selected-weather').text()).toBe('晴')
    expect(wrapper.find('.active-nav-key').text()).toBe('temperature-trend')
  })

  it('switches between overview and temperature trend from local nav actions', async () => {
    const { wrapper, router } = await mountOverviewView('/weather/武汉市')

    await wrapper.find('.to-trend').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('city-temperature-trend')

    await wrapper.find('.to-overview').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('city-detail')
  })

  it('switches to the dedicated map route from local nav actions', async () => {
    const { wrapper, router } = await mountOverviewView('/weather/武汉市')

    await wrapper.find('.to-map').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('city-weather-map')
    expect(router.currentRoute.value.fullPath).toBe('/weather/%E6%AD%A6%E6%B1%89%E5%B8%82/map')
  })

  it('switches to the dedicated daily weather route from local nav actions', async () => {
    const { wrapper, router } = await mountOverviewView('/weather/武汉市')

    await wrapper.find('.to-daily-weather').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('city-daily-weather')
    expect(router.currentRoute.value.fullPath).toBe('/weather/%E6%AD%A6%E6%B1%89%E5%B8%82/daily-weather')
  })

  it('forwards local search submit to the shared weather search handler', async () => {
    const { wrapper, searchSubmitMock } = await mountOverviewView('/weather/武汉市')

    await wrapper.find('.submit-search').trigger('click')

    expect(searchSubmitMock).toHaveBeenCalledWith('南京')
  })
})
