import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    vi.useRealTimers()
    echartsInstanceMock.setOption.mockReset()
    echartsInstanceMock.resize.mockReset()
    echartsInstanceMock.dispose.mockReset()
    echartsInitMock.mockReset()
    echartsInitMock.mockReturnValue(echartsInstanceMock)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const dailyItems = Array.from({ length: 90 }, (_, index) => {
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
  })

  const mountPanel = async () => {
    const wrapper = mount(WeeklyTemperatureTrendPanel, {
      props: {
        cityName: '武汉市',
        temperature: '26°C',
        dailyItems,
      },
    })

    await flushPromises()
    return wrapper
  }

  const getLatestWeeklyChartCall = () =>
    [...echartsInstanceMock.setOption.mock.calls]
      .map((call) => call[0] as {
        legend?: { show: boolean }
        xAxis: { data: string[] }
        series: Array<{ name: string; type: string; data: number[] }>
      })
      .reverse()
      .map((option, index, calls) => [option, echartsInstanceMock.setOption.mock.calls[calls.length - 1 - index]?.[1]] as const)
      .find(([option]) => option.legend?.show === false) as readonly [{
        legend: { show: boolean }
        xAxis: { data: string[] }
        series: Array<{ name: string; type: string; data: number[] }>
      }, unknown]

  const getLatestOption = () => getLatestWeeklyChartCall()[0]
  const expectLatestWeeklyChartRebuilt = () => {
    expect(getLatestWeeklyChartCall()[1]).toBe(true)
  }

  it('renders weekly title and initializes a combined weekly chart', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.find('[data-testid="weekly-temperature-trend-chart"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('武汉市 7日温度趋势')
    expect(wrapper.find('[data-testid="forecast-range-select"]').exists()).toBe(true)

    const option = getLatestOption()
    expect(option.legend.show).toBe(false)
    expect(option.xAxis.data).toHaveLength(7)
    expect(option.series).toHaveLength(3)
    expect(option.series[1]?.data[0]).toBe(30)
    expect(option.series[2]?.data[0]).toBe(20)
    expectLatestWeeklyChartRebuilt()
  })

  it('toggles weekly series visibility with chart mode controls', async () => {
    const wrapper = await mountPanel()
    const buttons = wrapper.findAll('.mode-btn')

    await buttons[0]!.trigger('click')
    await flushPromises()
    let option = getLatestOption()
    expect(option.series.map((item) => item.name)).toEqual(['平均气温'])

    await buttons[1]!.trigger('click')
    await flushPromises()
    option = getLatestOption()
    expect(option.series.map((item) => item.name)).toEqual(['最高气温', '最低气温'])

    await buttons[2]!.trigger('click')
    await flushPromises()
    option = getLatestOption()
    expect(option.series.map((item) => item.name)).toEqual(['平均气温', '最高气温', '最低气温'])
  })

  it('syncs the upper chart with 7 day, 15 day and 90 day range changes', async () => {
    const wrapper = await mountPanel()
    const select = wrapper.get('[data-testid="forecast-range-select"]')

    await select.setValue('15d')
    await flushPromises()
    let option = getLatestOption()
    expect(wrapper.text()).toContain('武汉市 15日温度趋势')
    expect(option.xAxis.data).toHaveLength(15)
    expect(option.series.map((item) => item.data.length)).toEqual([15, 15, 15])
    expect(wrapper.findAll('.forecast-row')).toHaveLength(15)
    expect(wrapper.find('[data-testid="forecast-range-90d"]').exists()).toBe(false)
    expectLatestWeeklyChartRebuilt()

    await select.setValue('90d')
    await flushPromises()
    option = getLatestOption()
    expect(option.xAxis.data.length).toBeGreaterThan(1)
    expect(option.series).toHaveLength(3)
    expect(option.series.map((item) => item.data.length)).toEqual([
      option.xAxis.data.length,
      option.xAxis.data.length,
      option.xAxis.data.length,
    ])
    expect(wrapper.find('[data-testid="forecast-range-90d"]').exists()).toBe(true)
    expect(wrapper.findAll('.forecast-row').length).toBeGreaterThan(0)
    expectLatestWeeklyChartRebuilt()

    await select.setValue('7d')
    await flushPromises()
    option = getLatestOption()
    expect(wrapper.text()).toContain('武汉市 7日温度趋势')
    expect(option.xAxis.data).toHaveLength(7)
    expect(option.series.map((item) => item.data.length)).toEqual([7, 7, 7])
    expect(wrapper.findAll('.forecast-row')).toHaveLength(7)
    expect(wrapper.find('[data-testid="forecast-range-90d"]').exists()).toBe(false)
    expectLatestWeeklyChartRebuilt()
  })

  it('forwards forecast date selection to the parent view', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-04T08:00:00+08:00'))

    const wrapper = await mountPanel()
    await wrapper.find('.forecast-row').trigger('click')

    expect(wrapper.emitted('date-select')).toEqual([['2026-05-04']])
  })

  it('shows detailed rows in the bottom forecast list', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.findAll('.forecast-icon img').length).toBeGreaterThan(0)
    expect(wrapper.find('.forecast-date').exists()).toBe(true)
    expect(wrapper.find('.forecast-temp').exists()).toBe(true)
    expect(wrapper.find('.forecast-relation').text()).toBe('今天')
  })

  it('keeps the custom legend synchronized with chart mode', async () => {
    const wrapper = await mountPanel()
    const buttons = wrapper.findAll('.mode-btn')

    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-average"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-high"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-low"]').exists()).toBe(true)

    await buttons[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-average"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-high"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-low"]').exists()).toBe(false)

    await buttons[1]!.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-average"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-high"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-temperature-trend-legend-low"]').exists()).toBe(true)
  })
})
