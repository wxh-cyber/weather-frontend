import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CityDetail from '@/views/CityDetail.vue'
import { useCityStore } from '@/store/city'

const { pushMock, routeMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  routeMock: {
    params: {
      cityName: '武汉市',
    },
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => ({
    push: pushMock,
  }),
}))

describe('CityDetail view', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockReset()
    routeMock.params.cityName = '武汉市'
  })

  const mountCityDetail = () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const cityStore = useCityStore(pinia)
    cityStore.setCities([
      { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
      { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
    ])

    return mount(CityDetail, {
      global: {
        plugins: [pinia],
        stubs: {
          WeatherPageShell: {
            props: ['cityName', 'weatherText'],
            template: '<section><slot /></section>',
          },
          WeatherCityOverview: {
            name: 'WeatherCityOverview',
            emits: ['city-select'],
            template: `
              <div>
                <button class="select-shanghai" @click="$emit('city-select', '上海市')">切换上海</button>
                <button class="select-wuhan" @click="$emit('city-select', '武汉市')">切换武汉</button>
              </div>
            `,
          },
        },
      },
    })
  }

  it('pushes a new city-detail route when selecting another city', async () => {
    const wrapper = mountCityDetail()

    await wrapper.find('.select-shanghai').trigger('click')

    expect(pushMock).toHaveBeenCalledWith({
      name: 'city-detail',
      params: {
        cityName: '上海市',
      },
    })
  })

  it('does not push again when selecting the current route city', async () => {
    const wrapper = mountCityDetail()

    await wrapper.find('.select-wuhan').trigger('click')

    expect(pushMock).not.toHaveBeenCalled()
  })
})
