import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    echartsInstanceMock.setOption.mockReset()
    echartsInstanceMock.resize.mockReset()
    echartsInstanceMock.dispose.mockReset()
    echartsInitMock.mockReset()
    echartsInitMock.mockReturnValue(echartsInstanceMock)
  })

  const mountPanel = async () => {
    const wrapper = mount(ForecastRangePanel, {
      props: {
        cityName: '武汉市',
        temperature: '26°C',
      },
    })

    await flushPromises()
    return wrapper
  }

  it('renders a 7-day forecast list by default', async () => {
    const wrapper = await mountPanel()

    const select = wrapper.get('[data-testid="forecast-range-select"]')
    expect((select.element as HTMLSelectElement).value).toBe('7d')

    const rows = wrapper.findAll('.forecast-row')
    expect(rows).toHaveLength(7)
    expect(wrapper.find('[data-testid="forecast-range-90d"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('今天')
    expect(wrapper.findAll('.forecast-icon img').length).toBeGreaterThan(0)
    expect(wrapper.emitted('range-change')).toEqual([['7d']])
  })

  it('expands to a 15-day list when selecting 15 days', async () => {
    const wrapper = await mountPanel()
    const select = wrapper.get('[data-testid="forecast-range-select"]')

    await select.setValue('15d')
    await flushPromises()

    const rows = wrapper.findAll('.forecast-row')
    expect(rows).toHaveLength(15)
    expect(wrapper.find('[data-testid="forecast-range-90d"]').exists()).toBe(false)
    expect(wrapper.emitted('range-change')).toEqual([['7d'], ['15d']])
  })

  it('switches to 90-day segmented mode and syncs bucket selection with chart and list', async () => {
    const wrapper = await mountPanel()
    const select = wrapper.get('[data-testid="forecast-range-select"]')

    await select.setValue('90d')
    await flushPromises()

    expect(wrapper.find('[data-testid="forecast-range-90d"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="forecast-bucket-chart"]').exists()).toBe(true)

    const bucketButtons = wrapper.findAll('.bucket-chip')
    expect(bucketButtons.length).toBeGreaterThan(0)
    expect(bucketButtons.some((button) => button.classes().includes('is-active'))).toBe(true)

    const initialRows = wrapper.findAll('.forecast-row').length
    expect(initialRows).toBeGreaterThan(0)

    if (bucketButtons.length > 1) {
      await bucketButtons[1]!.trigger('click')
      await flushPromises()
      expect(bucketButtons[1]!.classes()).toContain('is-active')
    }

    expect(echartsInitMock).toHaveBeenCalledTimes(1)
    expect(echartsInstanceMock.setOption).toHaveBeenCalled()
    expect(wrapper.emitted('range-change')).toEqual([['7d'], ['90d']])
  })
})
