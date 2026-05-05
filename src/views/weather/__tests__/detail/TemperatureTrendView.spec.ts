import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { weatherSearchSubmitKey } from '@/layout/helpers/weatherSearch'
import { createMemoryHistory, createRouter } from 'vue-router'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/store/auth'
import TemperatureTrendView from '@/views/weather/detail/TemperatureTrendView.vue'
import { useCityStore } from '@/store/city'

const { echartsInstanceMock, echartsInitMock, getDailyWeatherMock } = vi.hoisted(() => ({
  echartsInstanceMock: {
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  },
  echartsInitMock: vi.fn(),
  getDailyWeatherMock: vi.fn(),
}))

vi.mock('echarts', () => ({
  init: echartsInitMock,
  graphic: {
    LinearGradient: class LinearGradient {
      constructor(
        public readonly x0: number,
        public readonly y0: number,
        public readonly x1: number,
        public readonly y1: number,
        public readonly colorStops: unknown[],
      ) {}
    },
  },
}))

vi.mock('@/service/weather', async () => {
  const actual = await vi.importActual<typeof import('@/service/weather')>('@/service/weather')
  return {
    ...actual,
    getDailyWeather: getDailyWeatherMock,
  }
})

describe('TemperatureTrendView', () => {
  const WeatherDetailHeaderStub = defineComponent({
    props: {
      navItems: {
        type: Array,
        required: true,
      },
      activeNavKey: {
        type: String,
        required: true,
      },
    },
    emits: ['nav-select', 'search-submit'],
    setup(_, { emit }) {
      const keyword = ref('')
      return {
        keyword,
        emit,
      }
    },
    template: `
      <header class="weather-detail-header-stub">
        <span class="shared-active-nav">{{ activeNavKey }}</span>
        <nav class="shared-nav-row" data-testid="weather-detail-header-nav">
          <button
            v-for="item in navItems"
            :key="item.key"
            class="menu-button"
            @click="emit('nav-select', item.key)"
          >
            {{ item.label }}
          </button>
        </nav>
        <input
          v-model="keyword"
          class="shared-search-input"
          placeholder="搜索城市"
          @input="keyword = $event.target.value"
          @keydown.enter="emit('search-submit', keyword)"
        />
      </header>
    `,
  })

  beforeEach(() => {
    vi.useRealTimers()
    echartsInstanceMock.setOption.mockReset()
    echartsInstanceMock.resize.mockReset()
    echartsInstanceMock.dispose.mockReset()
    echartsInitMock.mockReset()
    echartsInitMock.mockReturnValue(echartsInstanceMock)
    getDailyWeatherMock.mockReset()
    getDailyWeatherMock.mockResolvedValue({
      data: {
        items: Array.from({ length: 90 }, (_, index) => {
          const date = new Date('2026-05-04T00:00:00+08:00')
          date.setDate(date.getDate() + index)
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return {
            date: `${date.getFullYear()}-${month}-${day}`,
            weatherText: '晴',
            temperatureMax: `${30 + index}°C`,
            temperatureMin: `${20 + index}°C`,
          }
        }),
      },
    })
    localStorage.clear()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      writable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const bundledDailyItems = [
    {
      date: '2026-05-04',
      weatherText: '阴',
      temperatureMax: '25°C',
      temperatureMin: '18°C',
    },
    {
      date: '2026-05-05',
      weatherText: '多云',
      temperatureMax: '27°C',
      temperatureMin: '19°C',
    },
  ]

  const mountTrendView = async (options?: { withBundle?: boolean }) => {
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
        { path: '/weather/:cityName/temperature-trend', name: 'city-temperature-trend', component: TemperatureTrendView },
        { path: '/weather/:cityName/map', name: 'city-weather-map', component: { template: '<div />' } },
        { path: '/weather/:cityName/daily-weather', name: 'city-daily-weather', component: { template: '<div />' } },
      ],
    })

    await router.push('/weather/武汉市/temperature-trend')
    await router.isReady()

    const pinia = createPinia()
    setActivePinia(pinia)
    const cityStore = useCityStore(pinia)
    cityStore.setCities([
      {
        cityId: 'city-1',
        cityName: '武汉市',
        weatherText: '晴',
        temperature: '26°C',
        weather: options?.withBundle
          ? {
              current: {
                cityId: 'city-1',
                cityName: '武汉市',
                weatherText: '晴',
                temperature: '26°C',
                observedAt: '2026-05-04T08:00',
                source: 'open-meteo',
              },
              hourly: {
                cityId: 'city-1',
                cityName: '武汉市',
                source: 'open-meteo',
                items: [],
              },
              daily: {
                cityId: 'city-1',
                cityName: '武汉市',
                source: 'open-meteo',
                items: bundledDailyItems,
              },
              dailyDetail: {
                cityId: 'city-1',
                cityName: '武汉市',
                source: 'open-meteo',
                items: [],
              },
            }
          : undefined,
      },
      { cityId: 'city-2', cityName: '北京市', weatherText: '多云', temperature: '20°C' },
    ])
    const searchSubmitMock = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(TemperatureTrendView, {
      global: {
        plugins: [pinia, router],
        provide: {
          [weatherSearchSubmitKey]: searchSubmitMock,
        },
        stubs: {
          'el-icon': {
            template: '<span><slot /></span>',
          },
          WeatherDetailHeader: WeatherDetailHeaderStub,
        },
      },
    })

    await flushPromises()
    return { wrapper, router, searchSubmitMock }
  }

  const getLatestOption = () =>
    [...echartsInstanceMock.setOption.mock.calls]
      .map((call) => call[0] as {
        legend?: { show: boolean }
        xAxis: { data: string[] }
        series: Array<{ name: string; type: string }>
      })
      .reverse()
      .find((option) => option.legend?.show === false) as {
        xAxis: { data: string[] }
        series: Array<{ name: string; type: string }>
      }

  it('renders the shared top navigation, search, tabs and chart', async () => {
    const { wrapper } = await mountTrendView()

    expect(wrapper.find('.weather-detail-header-stub').exists()).toBe(true)
    expect(wrapper.find('[data-testid="forecast-range-select"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-chart"]').exists()).toBe(true)
    expect(echartsInitMock).toHaveBeenCalledTimes(1)
    expect(getLatestOption().xAxis.data).toHaveLength(7)
  })

  it('navigates through the top nav and forwards search submissions', async () => {
    const { wrapper, router, searchSubmitMock } = await mountTrendView()

    const navButtons = wrapper.findAll('.menu-button')
    await navButtons[0]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('city-detail')

    await router.push('/weather/武汉市/temperature-trend')
    await flushPromises()
    await navButtons[2]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('city-weather-map')

    await router.push('/weather/武汉市/temperature-trend')
    await flushPromises()
    const searchInput = wrapper.get('.shared-search-input')
    await searchInput.setValue('北京')
    await searchInput.trigger('keydown.enter')
    await flushPromises()
    expect(searchSubmitMock).toHaveBeenCalledWith('北京')
  })

  it('updates the chart when switching 7 day, 15 day and 90 day ranges', async () => {
    const { wrapper } = await mountTrendView()
    const select = wrapper.get('[data-testid="forecast-range-select"]')

    await select.setValue('15d')
    await flushPromises()
    expect(getLatestOption().xAxis.data).toHaveLength(15)

    await select.setValue('90d')
    await flushPromises()
    expect(getLatestOption().xAxis.data.length).toBeGreaterThan(1)
    expect(wrapper.find('[data-testid="forecast-range-90d"]').exists()).toBe(true)

    await select.setValue('7d')
    await flushPromises()
    expect(getLatestOption().xAxis.data).toHaveLength(7)
  })

  it('navigates to the matching single day weather page when a forecast row is selected', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-04T08:00:00+08:00'))

    const { wrapper, router } = await mountTrendView()
    await wrapper.find('.forecast-row').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('city-daily-weather')
    expect(router.currentRoute.value.params.cityName).toBe('武汉市')
    expect(router.currentRoute.value.query.date).toBe('2026-05-04')
  })

  it('shows forecast rows on the temperature trend route', async () => {
    const { wrapper } = await mountTrendView()

    expect(wrapper.findAll('.forecast-icon img').length).toBeGreaterThan(0)
    expect(wrapper.find('.forecast-date').exists()).toBe(true)
    expect(wrapper.find('.forecast-temp').exists()).toBe(true)
  })

  it('renders bundled daily weather before backend refresh completes', async () => {
    getDailyWeatherMock.mockReturnValueOnce(new Promise(() => {}))

    const { wrapper } = await mountTrendView({ withBundle: true })

    expect(wrapper.findAll('.forecast-icon img')).toHaveLength(2)
    expect(getLatestOption().xAxis.data).toHaveLength(2)
  })

  it('keeps bundled daily weather when backend refresh fails', async () => {
    getDailyWeatherMock.mockRejectedValueOnce(new Error('network'))

    const { wrapper } = await mountTrendView({ withBundle: true })

    await flushPromises()

    expect(wrapper.findAll('.forecast-icon img')).toHaveLength(2)
    expect(getLatestOption().xAxis.data).toHaveLength(2)
  })
})
