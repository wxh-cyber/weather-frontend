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

  const createTestRouter = (initialPath = '/weather/武汉市') =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/weather/:cityName', name: 'city-detail', component: { template: '<div />' } },
        { path: '/weather/:cityName/temperature-trend', name: 'city-temperature-trend', component: { template: '<div />' } },
      ],
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
      },
      global: {
        plugins: [router],
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons[0]?.classes()).toContain('active')
    expect(buttons[1]?.classes()).not.toContain('active')
    expect(wrapper.find('[data-testid="hourly-forecast-cards"]').exists()).toBe(true)

    await buttons[1]!.trigger('click')

    expect(router.currentRoute.value.name).toBe('city-detail')
    expect(buttons[1]?.classes()).toContain('active')
    expect(wrapper.find('[data-testid="temperature-trend-chart"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="temperature-trend-interval-select"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="hourly-forecast-cards"]').exists()).toBe(false)

    await buttons[0]!.trigger('click')

    expect(router.currentRoute.value.name).toBe('city-detail')
    expect(buttons[0]?.classes()).toContain('active')
    expect(wrapper.find('[data-testid="hourly-forecast-cards"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="temperature-trend-chart"]').exists()).toBe(false)
  })
})
