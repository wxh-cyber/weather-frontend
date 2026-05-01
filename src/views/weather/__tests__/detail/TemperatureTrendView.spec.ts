import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { weatherSearchSubmitKey } from '@/layout/helpers/weatherSearch'
import { createMemoryHistory, createRouter } from 'vue-router'
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
        { path: '/weather/:cityName/map', name: 'city-weather-map', component: { template: '<div />' } },
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
        },
      },
    })

    await flushPromises()
    return { wrapper, router, searchSubmitMock }
  }

  const getLatestOption = () =>
    echartsInstanceMock.setOption.mock.calls[echartsInstanceMock.setOption.mock.calls.length - 1]?.[0] as {
      legend: { selected: Record<string, boolean> }
      xAxis: { data: string[] }
      series: Array<{ type: string }>
    }

  it('renders the shared top navigation, search, tabs and chart', async () => {
    const { wrapper } = await mountTrendView()

    expect(wrapper.text()).toContain('城市概览')
    expect(wrapper.text()).toContain('温度趋势')
    expect(wrapper.text()).toContain('天气地图')
    expect(wrapper.find('input[placeholder="搜索城市"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('北京市')
    expect(wrapper.find('[data-testid="weekly-temperature-trend-chart"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="forecast-range-select"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('武汉市 周温度趋势')
    expect(wrapper.text()).toContain('柱状图')
    expect(wrapper.text()).toContain('折线图')
    expect(wrapper.text()).toContain('同时显示')
    expect(echartsInitMock).toHaveBeenCalledTimes(1)
    expect(echartsInstanceMock.setOption).toHaveBeenCalled()

    const option = getLatestOption()
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

    const searchInput = wrapper.get('input[placeholder="搜索城市"]')
    await searchInput.setValue('上海市')
    await searchInput.trigger('keydown.enter')
    await flushPromises()

    expect(searchSubmitMock).toHaveBeenCalledWith('上海市')
  })

  it('updates series visibility when switching chart modes', async () => {
    const { wrapper } = await mountTrendView()

    const buttons = wrapper.findAll('.mode-btn')
    await buttons[0]!.trigger('click')
    await flushPromises()

    let latestOption = getLatestOption()
    expect(latestOption.legend.selected['平均气温']).toBe(true)
    expect(latestOption.legend.selected['最高气温']).toBe(false)
    expect(latestOption.legend.selected['最低气温']).toBe(false)

    await buttons[1]!.trigger('click')
    await flushPromises()

    latestOption = getLatestOption()
    expect(latestOption.legend.selected['平均气温']).toBe(false)
    expect(latestOption.legend.selected['最高气温']).toBe(true)
    expect(latestOption.legend.selected['最低气温']).toBe(true)

    await buttons[2]!.trigger('click')
    await flushPromises()

    latestOption = getLatestOption()
    expect(latestOption.legend.selected['平均气温']).toBe(true)
    expect(latestOption.legend.selected['最高气温']).toBe(true)
    expect(latestOption.legend.selected['最低气温']).toBe(true)
  })
})
