import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import CityOverviewView from '@/views/CityOverviewView.vue'
import { useCityStore } from '@/store/city'

describe('CityOverviewView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const mountOverviewView = async (initialPath: string) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/weather/:cityName', name: 'city-detail', component: CityOverviewView },
        { path: '/weather/:cityName/temperature-trend', name: 'city-temperature-trend', component: CityOverviewView },
      ],
    })

    await router.push(initialPath)
    await router.isReady()

    const pinia = createPinia()
    setActivePinia(pinia)
    const cityStore = useCityStore(pinia)
    cityStore.setCities([
      { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
      { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
    ])

    const wrapper = mount(CityOverviewView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          WeatherCityOverview: {
            props: ['selectedCityName', 'temperature', 'weatherText'],
            template: `
              <section class="weather-city-overview-stub">
                <span class="selected-city">{{ selectedCityName }}</span>
                <span class="selected-temperature">{{ temperature }}</span>
                <span class="selected-weather">{{ weatherText }}</span>
              </section>
            `,
          },
        },
      },
    })

    return { wrapper, router }
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
  })
})
