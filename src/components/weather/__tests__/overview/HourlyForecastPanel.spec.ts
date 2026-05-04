import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import HourlyForecastPanel from '@/components/weather/overview/HourlyForecastPanel.vue'

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

describe('HourlyForecastPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    echartsInstanceMock.setOption.mockReset()
    echartsInstanceMock.resize.mockReset()
    echartsInstanceMock.dispose.mockReset()
    echartsInitMock.mockReset()
    echartsInitMock.mockReturnValue(echartsInstanceMock)
  })

  const createTestRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/weather/:cityName', name: 'city-detail', component: { template: '<div />' } },
        { path: '/weather/:cityName/temperature-trend', name: 'city-temperature-trend', component: { template: '<div />' } },
      ],
    })

  const hourlyItems = Array.from({ length: 8 }, (_, index) => ({
    time: `2026-05-04T${String(8 + index).padStart(2, '0')}:00`,
    temperature: `${24 + index}°C`,
    weatherText: index % 2 === 0 ? '小雨' : '晴',
    apparentTemperature: `${25 + index}°C`,
    precipitationProbability: `${40 + index}%`,
    precipitationAmount: `${index}.0 mm`,
    windDirection: '东北',
    windSpeed: `${12 + index} km/h`,
    humidity: `${70 + index}%`,
    cloudCover: `${50 + index}%`,
    airQuality: `AQI ${40 + index}`,
  }))

  it('renders compact hourly cards with aggregated high and low temperatures only', async () => {
    const router = createTestRouter()
    await router.push('/weather/武汉市')
    await router.isReady()

    const wrapper = mount(HourlyForecastPanel, {
      props: {
        cityName: '武汉市',
        temperature: '26°C',
        weatherText: '晴',
        hourlyItems,
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('[data-testid="hourly-forecast-interval-select"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="hourly-forecast-scroll"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="hourly-forecast-cards"]').exists()).toBe(true)
    expect(wrapper.findAll('.card')).toHaveLength(8)
    expect(wrapper.find('.card .day').text()).toBe('08:00')
    expect(wrapper.find('.card .temp-high').text()).toBe('24.0°')
    expect(wrapper.find('.card .temp-low').text()).toBe('24.0°')
    expect(wrapper.text()).not.toContain('体感')
    expect(wrapper.text()).not.toContain('降水')
    expect(wrapper.text()).not.toContain('AQI')
    expect(wrapper.text()).not.toContain('湿度')
  })

  it('updates card count when the overview interval changes', async () => {
    const wrapper = mount(HourlyForecastPanel, {
      props: {
        cityName: '武汉市',
        temperature: '26°C',
        weatherText: '晴',
        hourlyItems,
      },
    })

    const select = wrapper.get('[data-testid="hourly-forecast-interval-select"]')
    expect(wrapper.findAll('.card')).toHaveLength(8)

    await select.setValue('2h')
    expect(wrapper.findAll('.card')).toHaveLength(4)
    expect(wrapper.find('.card .temp-high').text()).toBe('25.0°')
    expect(wrapper.find('.card .temp-low').text()).toBe('24.0°')

    await select.setValue('4h')
    expect(wrapper.findAll('.card')).toHaveLength(2)
    expect(wrapper.find('.card .temp-high').text()).toBe('27.0°')
    expect(wrapper.find('.card .temp-low').text()).toBe('24.0°')
  })

  it('switches to temperature trend locally without changing the route', async () => {
    const router = createTestRouter()
    await router.push('/weather/武汉市')
    await router.isReady()

    const wrapper = mount(HourlyForecastPanel, {
      props: {
        cityName: '武汉市',
        temperature: '26°C',
        weatherText: '晴',
        hourlyItems,
      },
      global: {
        plugins: [router],
      },
    })

    const buttons = wrapper.findAll('.chip')
    await buttons[1]!.trigger('click')

    expect(router.currentRoute.value.name).toBe('city-detail')
    expect(wrapper.find('[data-testid="temperature-trend-chart"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="temperature-trend-interval-select"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="hourly-forecast-cards"]').exists()).toBe(false)

    await buttons[0]!.trigger('click')

    expect(router.currentRoute.value.name).toBe('city-detail')
    expect(wrapper.find('[data-testid="hourly-forecast-cards"]').exists()).toBe(true)
  })
})
