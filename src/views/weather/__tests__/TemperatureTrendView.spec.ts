import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import TemperatureTrendView from '@/views/weather/TemperatureTrendView.vue'
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
  beforeEach(() => {
    echartsInstanceMock.setOption.mockReset()
    echartsInstanceMock.resize.mockReset()
    echartsInstanceMock.dispose.mockReset()
    echartsInitMock.mockReset()
    echartsInitMock.mockReturnValue(echartsInstanceMock)
    localStorage.clear()
  })

  const mountTrendView = async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/weather/:cityName', name: 'city-detail', component: { template: '<div />' } },
        { path: '/weather/:cityName/temperature-trend', name: 'city-temperature-trend', component: TemperatureTrendView },
      ],
    })

    await router.push('/weather/武汉市/temperature-trend')
    await router.isReady()

    const pinia = createPinia()
    setActivePinia(pinia)
    const cityStore = useCityStore(pinia)
    cityStore.setCities([
      { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
    ])

    const wrapper = mount(TemperatureTrendView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    return { wrapper, router }
  }

  const getLatestOption = () =>
    echartsInstanceMock.setOption.mock.calls[echartsInstanceMock.setOption.mock.calls.length - 1]?.[0] as {
      legend: { selected: Record<string, boolean> }
    }

  it('initializes echarts and renders chart mode buttons', async () => {
    const { wrapper } = await mountTrendView()

    expect(wrapper.find('[data-testid="temperature-trend-chart"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('武汉市 温度轨迹')
    expect(wrapper.text()).toContain('柱状图')
    expect(wrapper.text()).toContain('折线图')
    expect(wrapper.text()).toContain('同时显示')
    expect(echartsInitMock).toHaveBeenCalledTimes(1)
    expect(echartsInstanceMock.setOption).toHaveBeenCalled()
  })

  it('updates series visibility when switching chart modes', async () => {
    const { wrapper } = await mountTrendView()

    const buttons = wrapper.findAll('.mode-btn')
    await buttons[0]!.trigger('click')
    await flushPromises()

    let latestOption = getLatestOption()
    expect(latestOption.legend.selected['温度柱状']).toBe(true)
    expect(latestOption.legend.selected['温度折线']).toBe(false)

    await buttons[1]!.trigger('click')
    await flushPromises()

    latestOption = getLatestOption()
    expect(latestOption.legend.selected['温度柱状']).toBe(false)
    expect(latestOption.legend.selected['温度折线']).toBe(true)

    await buttons[2]!.trigger('click')
    await flushPromises()

    latestOption = getLatestOption()
    expect(latestOption.legend.selected['温度柱状']).toBe(true)
    expect(latestOption.legend.selected['温度折线']).toBe(true)
  })
})
