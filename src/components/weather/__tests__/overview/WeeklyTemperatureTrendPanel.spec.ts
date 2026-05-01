import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import WeeklyTemperatureTrendPanel from '@/components/weather/overview/WeeklyTemperatureTrendPanel.vue'

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

describe('WeeklyTemperatureTrendPanel', () => {
  beforeEach(() => {
    echartsInstanceMock.setOption.mockReset()
    echartsInstanceMock.resize.mockReset()
    echartsInstanceMock.dispose.mockReset()
    echartsInitMock.mockReset()
    echartsInitMock.mockReturnValue(echartsInstanceMock)
  })

  const mountPanel = async () => {
    const wrapper = mount(WeeklyTemperatureTrendPanel, {
      props: {
        cityName: '武汉市',
        temperature: '26°C',
      },
    })

    await flushPromises()
    return wrapper
  }

  const getLatestOption = () =>
    echartsInstanceMock.setOption.mock.calls[echartsInstanceMock.setOption.mock.calls.length - 1]?.[0] as {
      legend: { selected: Record<string, boolean> }
      xAxis: { data: string[] }
      series: Array<{ type: string; data: number[] }>
    }

  it('renders weekly title and initializes a combined weekly chart', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.find('[data-testid="weekly-temperature-trend-chart"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('武汉市 周温度趋势')
    expect(wrapper.text()).toContain('柱状图')
    expect(wrapper.text()).toContain('折线图')
    expect(wrapper.text()).toContain('同时显示')
    expect(wrapper.find('[data-testid="forecast-range-select"]').exists()).toBe(true)

    const option = getLatestOption()
    expect(option.xAxis.data).toHaveLength(7)
    expect(option.series).toHaveLength(3)
    expect(option.series[0]?.type).toBe('bar')
    expect(option.series[1]?.type).toBe('line')
    expect(option.series[2]?.type).toBe('line')
  })

  it('toggles weekly series visibility with chart mode controls', async () => {
    const wrapper = await mountPanel()
    const buttons = wrapper.findAll('.mode-btn')

    await buttons[0]!.trigger('click')
    await flushPromises()

    let option = getLatestOption()
    expect(option.legend.selected['平均气温']).toBe(true)
    expect(option.legend.selected['最高气温']).toBe(false)
    expect(option.legend.selected['最低气温']).toBe(false)

    await buttons[1]!.trigger('click')
    await flushPromises()

    option = getLatestOption()
    expect(option.legend.selected['平均气温']).toBe(false)
    expect(option.legend.selected['最高气温']).toBe(true)
    expect(option.legend.selected['最低气温']).toBe(true)

    await buttons[2]!.trigger('click')
    await flushPromises()

    option = getLatestOption()
    expect(option.legend.selected['平均气温']).toBe(true)
    expect(option.legend.selected['最高气温']).toBe(true)
    expect(option.legend.selected['最低气温']).toBe(true)
  })
})
