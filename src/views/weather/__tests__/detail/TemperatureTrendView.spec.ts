import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { weatherSearchSubmitKey } from '@/layout/helpers/weatherSearch'
import { createMemoryHistory, createRouter } from 'vue-router'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/store/auth'
import TemperatureTrendView from '@/views/weather/detail/TemperatureTrendView.vue'
import { useCityStore } from '@/store/city'

const { echartsInstanceMock, echartsInitMock } = vi.hoisted(() => ({
  echartsInstanceMock: {
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  },
  echartsInitMock: vi.fn(),
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

  const mountTrendView = async () => {
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
      { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
      { cityName: '北京市', weatherText: '多云', temperature: '20°C' },
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
    echartsInstanceMock.setOption.mock.calls[echartsInstanceMock.setOption.mock.calls.length - 1]?.[0] as {
      legend: { show: boolean }
      xAxis: { data: string[] }
      series: Array<{ name: string; type: string }>
    }

  it('renders the shared top navigation, search, tabs and chart', async () => {
    const { wrapper } = await mountTrendView()

    expect(wrapper.text()).toContain('城市概览')
    expect(wrapper.text()).toContain('温度趋势')
    expect(wrapper.text()).toContain('天气地图')
    expect(wrapper.text()).toContain('单日天气')
    expect(wrapper.find('.weather-detail-header-stub').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-detail-header-nav"]').exists()).toBe(true)
    expect(wrapper.find('.shared-active-nav').text()).toBe('temperature-trend')
    expect(wrapper.find('.shared-search-input').exists()).toBe(true)
    expect(wrapper.text()).toContain('北京市')
    expect(wrapper.find('[data-testid="weekly-temperature-trend-chart"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="forecast-range-select"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('武汉市 周温度趋势')
    expect(wrapper.text()).toContain('柱状图')
    expect(wrapper.text()).toContain('折线图')
    expect(wrapper.text()).toContain('同时显示')
    expect(echartsInitMock).toHaveBeenCalledTimes(1)
    expect(echartsInstanceMock.setOption).toHaveBeenCalled()

    const option = getLatestOption()
    expect(option.legend.show).toBe(false)
    expect(option.xAxis.data).toHaveLength(7)
    expect(option.series).toHaveLength(3)
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

    await navButtons[3]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('city-daily-weather')

    await router.push('/weather/武汉市/temperature-trend')
    await flushPromises()

    const searchInput = wrapper.get('.shared-search-input')
    await searchInput.setValue('北京')
    await searchInput.trigger('keydown.enter')
    await flushPromises()

    expect(searchSubmitMock).toHaveBeenCalledWith('北京')
  })

  it('updates series visibility when switching chart modes', async () => {
    const { wrapper } = await mountTrendView()

    const buttons = wrapper.findAll('.mode-btn')
    await buttons[0]!.trigger('click')
    await flushPromises()

    let latestOption = getLatestOption()
    expect(latestOption.series.map((item) => item.name)).toEqual(['平均气温'])
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-average"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-high"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-low"]').exists()).toBe(false)

    await buttons[1]!.trigger('click')
    await flushPromises()

    latestOption = getLatestOption()
    expect(latestOption.series.map((item) => item.name)).toEqual(['最高气温', '最低气温'])
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-average"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-high"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-low"]').exists()).toBe(true)

    await buttons[2]!.trigger('click')
    await flushPromises()

    latestOption = getLatestOption()
    expect(latestOption.series.map((item) => item.name)).toEqual(['平均气温', '最高气温', '最低气温'])
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-average"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-high"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-low"]').exists()).toBe(true)
  })

  it('navigates to the matching single-day weather page when a forecast row is selected', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-04T08:00:00+08:00'))

    const { wrapper, router } = await mountTrendView()

    await wrapper.find('.forecast-row').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('city-daily-weather')
    expect(router.currentRoute.value.params.cityName).toBe('武汉市')
    expect(router.currentRoute.value.query.date).toBe('2026-05-04')
  })
})
