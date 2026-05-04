import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ForecastRangePanel from '@/components/weather/overview/ForecastRangePanel.vue'

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

describe('ForecastRangePanel', () => {
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

  const backendDailyItems = Array.from({ length: 90 }, (_, index) => {
    const date = new Date('2026-05-04T00:00:00+08:00')
    date.setDate(date.getDate() + index)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return {
      date: `${date.getFullYear()}-${month}-${day}`,
      weatherText: index === 0 ? '小雨' : '晴',
      temperatureMax: `${31 + index}°C`,
      temperatureMin: `${20 + index}°C`,
    }
  })

  const mountPanel = async () => {
    const wrapper = mount(ForecastRangePanel, {
      props: {
        cityName: '武汉市',
        temperature: '26°C',
        dailyItems: backendDailyItems,
      },
    })

    await flushPromises()
    return wrapper
  }

  it('renders a 7 day forecast list by default', async () => {
    const wrapper = await mountPanel()

    expect((wrapper.get('[data-testid="forecast-range-select"]').element as HTMLSelectElement).value).toBe('7d')
    expect(wrapper.findAll('.forecast-row')).toHaveLength(7)
    expect(wrapper.find('[data-testid="forecast-range-90d"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('今天')
    expect(wrapper.emitted('range-change')?.[0]).toEqual(['7d'])
  })

  it('renders forecast rows from backend daily items', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-04T08:00:00+08:00'))

    const wrapper = await mountPanel()
    expect(wrapper.find('.forecast-month').text()).toBe('5月')
    expect(wrapper.find('.forecast-day').text()).toBe('4日')
    expect(wrapper.find('.forecast-relation').text()).toBe('今天')
    expect(wrapper.find('.forecast-temp-high').text()).toBe('31.0°')
    expect(wrapper.find('.forecast-temp-low').text()).toBe('20.0°')
  })

  it('emits the selected forecast date when clicking a list row', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-04T08:00:00+08:00'))

    const wrapper = await mountPanel()
    await wrapper.find('.forecast-row').trigger('click')

    expect(wrapper.emitted('date-select')).toEqual([['2026-05-04']])
  })

  it('expands to a 15 day list when selecting 15 days', async () => {
    const wrapper = await mountPanel()
    await wrapper.get('[data-testid="forecast-range-select"]').setValue('15d')
    await flushPromises()

    expect(wrapper.findAll('.forecast-row')).toHaveLength(15)
    expect(wrapper.find('[data-testid="forecast-range-90d"]').exists()).toBe(false)
  })

  it('switches to 90 day segmented mode and syncs bucket selection with chart and list', async () => {
    const wrapper = await mountPanel()
    await wrapper.get('[data-testid="forecast-range-select"]').setValue('90d')
    await flushPromises()

    expect(wrapper.find('[data-testid="forecast-range-90d"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="forecast-bucket-chart"]').exists()).toBe(true)

    const bucketButtons = wrapper.findAll('.bucket-chip')
    expect(bucketButtons.length).toBeGreaterThan(3)
    expect(bucketButtons[0]!.text()).toContain('5月上旬')
    expect(bucketButtons.some((button) => button.text().includes('6月'))).toBe(true)

    const initialRows = wrapper.findAll('.forecast-row')
    expect(initialRows.length).toBeGreaterThan(0)
    const initialFirstDay = initialRows[0]!.find('.forecast-day').text()

    await bucketButtons[1]!.trigger('click')
    await flushPromises()

    const nextRows = wrapper.findAll('.forecast-row')
    expect(bucketButtons[1]!.classes()).toContain('is-active')
    expect(nextRows[0]!.find('.forecast-day').text()).not.toBe(initialFirstDay)
    expect(echartsInitMock).toHaveBeenCalledTimes(1)
    expect(echartsInstanceMock.setOption).toHaveBeenCalled()
  })

  it('can still render icon only forecast rows for compact callers', async () => {
    const wrapper = mount(ForecastRangePanel, {
      props: {
        cityName: '武汉市',
        temperature: '26°C',
        dailyItems: backendDailyItems,
        iconOnly: true,
      },
    })
    await flushPromises()

    expect(wrapper.findAll('.forecast-row')).toHaveLength(7)
    expect(wrapper.findAll('.forecast-icon img').length).toBe(7)
    expect(wrapper.find('.forecast-date').exists()).toBe(false)
    expect(wrapper.find('.forecast-temp').exists()).toBe(false)
  })
})
