import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import TemperatureTrendPanel from '@/components/weather/overview/TemperatureTrendPanel.vue'

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

describe('TemperatureTrendPanel', () => {
  beforeEach(() => {
    echartsInstanceMock.setOption.mockReset()
    echartsInstanceMock.resize.mockReset()
    echartsInstanceMock.dispose.mockReset()
    echartsInitMock.mockReset()
    echartsInitMock.mockReturnValue(echartsInstanceMock)
  })

  const mountPanel = async () => {
    const wrapper = mount(TemperatureTrendPanel, {
      props: {
        cityName: '武汉市',
        temperature: '26°C',
        compact: true,
        showIntervalSelector: true,
      },
    })

    await flushPromises()
    return wrapper
  }

  const getLatestOption = () =>
    echartsInstanceMock.setOption.mock.calls[echartsInstanceMock.setOption.mock.calls.length - 1]?.[0] as {
      legend?: { selected: Record<string, boolean> }
      xAxis: { data: string[] }
      series: Array<{ data: number[] }>
    }

  it('renders interval selector with the default 1-hour sampling density', async () => {
    const wrapper = await mountPanel()

    const select = wrapper.get('[data-testid="temperature-trend-interval-select"]')
    expect(select.exists()).toBe(true)
    expect((select.element as HTMLSelectElement).value).toBe('1h')

    const option = getLatestOption()
    expect(option.xAxis.data).toHaveLength(24)
    expect(option.series[0]?.data).toHaveLength(24)
    expect(option.series[1]?.data).toHaveLength(24)
  })

  it('updates chart density when switching interval and preserves chart mode', async () => {
    const wrapper = await mountPanel()
    const select = wrapper.get('[data-testid="temperature-trend-interval-select"]')

    await select.setValue('30m')
    await flushPromises()

    let option = getLatestOption()
    expect(option.xAxis.data).toHaveLength(48)
    expect(option.series[0]?.data).toHaveLength(48)
    expect(option.series[1]?.data).toHaveLength(48)

    await select.setValue('2h')
    await flushPromises()

    option = getLatestOption()
    expect(option.xAxis.data).toHaveLength(12)
    expect(option.series[0]?.data).toHaveLength(12)
    expect(option.series[1]?.data).toHaveLength(12)

    await wrapper.setProps({ compact: false })
    await flushPromises()

    const modeButtons = wrapper.findAll('.mode-btn')
    await modeButtons[1]!.trigger('click')
    await flushPromises()

    await select.setValue('1h')
    await flushPromises()

    option = getLatestOption()
    expect(option.legend?.selected['温度柱状']).toBe(false)
    expect(option.legend?.selected['温度折线']).toBe(true)
    expect(option.xAxis.data).toHaveLength(24)
  })
})
