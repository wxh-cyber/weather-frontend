import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CityDetail from '@/views/weather/CityDetail.vue'
import { useCityStore } from '@/store/city'

const { routeMock } = vi.hoisted(() => ({
  routeMock: {
    params: {
      cityName: '武汉市',
    },
  },
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRoute: () => routeMock,
  }
})

describe('CityDetail view', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    routeMock.params.cityName = '武汉市'
  })

  it('renders weather shell with the selected city and keeps the overview mounted', () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const cityStore = useCityStore(pinia)
    cityStore.setCities([
      { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
      { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
    ])

    const wrapper = mount(CityDetail, {
      global: {
        plugins: [pinia],
        stubs: {
          WeatherPageShell: {
            props: ['cityName', 'weatherText'],
            template: '<section class="shell" :data-city-name="cityName" :data-weather-text="weatherText"><slot /></section>',
          },
          CityOverviewView: {
            template: '<div class="city-overview-view-stub" />',
          },
        },
      },
    })

    expect(wrapper.find('.shell').attributes('data-city-name')).toBe('武汉市')
    expect(wrapper.find('.shell').attributes('data-weather-text')).toBe('晴')
    expect(wrapper.find('.city-overview-view-stub').exists()).toBe(true)
  })
})
