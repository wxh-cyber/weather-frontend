import { defineComponent, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WeatherPageShell from '@/components/weather/WeatherPageShell.vue'

const resolveCityBackgroundMock = vi.fn()
const getCityBackgroundVariantMock = vi.fn()
const resolveWeatherOverlayPhaseMock = vi.fn()

vi.mock('@/utils/weather/cityBackgrounds', () => ({
  resolveCityBackground: (...args: unknown[]) => resolveCityBackgroundMock(...args),
  getCityBackgroundVariant: (...args: unknown[]) => getCityBackgroundVariantMock(...args),
}))

vi.mock('@/utils/weather/weatherOverlays', () => ({
  resolveWeatherOverlayPhase: (...args: unknown[]) => resolveWeatherOverlayPhaseMock(...args),
}))

const TransitionStub = defineComponent({
  template: '<slot />',
})

const createMatchMedia = (
  matchesMap: Record<string, boolean> = {
    '(max-width: 768px)': false,
    '(prefers-reduced-motion: reduce)': false,
  },
) =>
  vi.fn().mockImplementation((query: string) => ({
    matches: matchesMap[query] ?? false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))

describe('WeatherPageShell', () => {
  const overlayNone = {
    kind: 'none',
    layer: 'none',
    isAlternating: false,
    isLightningActive: false,
  } as const

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    })
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMedia(),
    })
  })

  it('renders background layer and internal scroll container when city has background', () => {
    resolveCityBackgroundMock.mockReturnValue('/assets/wuhan-day.jpg')
    getCityBackgroundVariantMock.mockReturnValue('day')
    resolveWeatherOverlayPhaseMock.mockReturnValue(overlayNone)

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '武汉市',
      },
      slots: {
        default: '<section class="shell-content">天气内容</section>',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    const backgroundLayer = wrapper.find('[data-background-key="武汉市:day:/assets/wuhan-day.jpg"]')
    expect(backgroundLayer.exists()).toBe(true)
    expect(backgroundLayer.attributes('style')).toContain('/assets/wuhan-day.jpg')
    expect(wrapper.attributes('data-weather-performance-mode')).toBe('full')
    expect(wrapper.find('[data-testid="weather-page-scroll"]').exists()).toBe(true)
    expect(wrapper.find('.shell-content').exists()).toBe(true)
  })

  it('delays background key updates by 1 second when selected city changes', async () => {
    vi.useFakeTimers()
    resolveCityBackgroundMock.mockImplementation((cityName: string) =>
      cityName === '武汉市' ? '/assets/wuhan-day.jpg' : '/assets/nanchang-day.jpg',
    )
    getCityBackgroundVariantMock.mockReturnValue('day')
    resolveWeatherOverlayPhaseMock.mockReturnValue(overlayNone)

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '武汉市',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    expect(wrapper.find('[data-background-key="武汉市:day:/assets/wuhan-day.jpg"]').exists()).toBe(true)

    await wrapper.setProps({
      cityName: '南昌市',
    })
    await nextTick()

    expect(wrapper.find('[data-background-key="武汉市:day:/assets/wuhan-day.jpg"]').exists()).toBe(true)
    expect(wrapper.find('[data-background-key="南昌市:day:/assets/nanchang-day.jpg"]').exists()).toBe(false)

    vi.advanceTimersByTime(1_000)
    await nextTick()

    expect(wrapper.find('[data-background-key="南昌市:day:/assets/nanchang-day.jpg"]').exists()).toBe(true)
  })

  it('falls back to empty background key when no background exists', () => {
    resolveCityBackgroundMock.mockReturnValue('')
    getCityBackgroundVariantMock.mockReturnValue('night')
    resolveWeatherOverlayPhaseMock.mockReturnValue(overlayNone)

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '不存在城市',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    expect(wrapper.find('[data-background-key="empty"]').exists()).toBe(true)
  })

  it('falls back to empty background 1 second after switching to a city without background', async () => {
    vi.useFakeTimers()
    resolveCityBackgroundMock.mockImplementation((cityName: string) =>
      cityName === '武汉市' ? '/assets/wuhan-day.jpg' : '',
    )
    getCityBackgroundVariantMock.mockReturnValue('day')
    resolveWeatherOverlayPhaseMock.mockReturnValue(overlayNone)

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '武汉市',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    expect(wrapper.find('[data-background-key="武汉市:day:/assets/wuhan-day.jpg"]').exists()).toBe(true)

    await wrapper.setProps({
      cityName: '不存在城市',
    })
    await nextTick()

    expect(wrapper.find('[data-background-key="武汉市:day:/assets/wuhan-day.jpg"]').exists()).toBe(true)

    vi.advanceTimersByTime(1_000)
    await nextTick()

    expect(wrapper.find('[data-background-key="empty"]').exists()).toBe(true)
  })

  it('only applies the last delayed background switch when cities change rapidly', async () => {
    vi.useFakeTimers()
    resolveCityBackgroundMock.mockImplementation((cityName: string) => {
      if (cityName === '武汉市') {
        return '/assets/wuhan-day.jpg'
      }

      if (cityName === '南昌市') {
        return '/assets/nanchang-day.jpg'
      }

      if (cityName === '上海市') {
        return '/assets/shanghai-day.jpg'
      }

      return ''
    })
    getCityBackgroundVariantMock.mockReturnValue('day')
    resolveWeatherOverlayPhaseMock.mockReturnValue(overlayNone)

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '武汉市',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    await wrapper.setProps({
      cityName: '南昌市',
    })
    await nextTick()

    vi.advanceTimersByTime(500)

    await wrapper.setProps({
      cityName: '上海市',
    })
    await nextTick()

    vi.advanceTimersByTime(500)
    await nextTick()

    expect(wrapper.find('[data-background-key="武汉市:day:/assets/wuhan-day.jpg"]').exists()).toBe(true)
    expect(wrapper.find('[data-background-key="南昌市:day:/assets/nanchang-day.jpg"]').exists()).toBe(false)
    expect(wrapper.find('[data-background-key="上海市:day:/assets/shanghai-day.jpg"]').exists()).toBe(false)

    vi.advanceTimersByTime(500)
    await nextTick()

    expect(wrapper.find('[data-background-key="上海市:day:/assets/shanghai-day.jpg"]').exists()).toBe(true)
  })

  it('renders weather overlay layers when weather text matches an effect', () => {
    resolveCityBackgroundMock.mockReturnValue('/assets/wuhan-day.jpg')
    getCityBackgroundVariantMock.mockReturnValue('day')
    resolveWeatherOverlayPhaseMock.mockReturnValue({
      kind: 'thunder-showers',
      layer: 'rainy',
      isAlternating: true,
      isLightningActive: true,
    })

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '武汉市',
        weatherText: '雷阵雨',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    expect(wrapper.find('[data-weather-overlay-kind="thunder-showers"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-overlay-layer="rainy"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-rain-stage="active"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-rain-contrast="active"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-rain-group="back"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-rain-group="mid"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-rain-group="front"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-lightning-stage="active"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-lightning-flash="active"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-lightning-afterglow="active"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-lightning-bolt="primary"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-lightning-bolt="secondary"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-lightning-branch="left"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-lightning-branch="right"]').exists()).toBe(true)
    expect(wrapper.find('.weather-overlay-layer--lightning').exists()).toBe(true)
  })

  it('updates weather overlay layer when weather text changes', async () => {
    resolveCityBackgroundMock.mockReturnValue('/assets/wuhan-day.jpg')
    getCityBackgroundVariantMock.mockReturnValue('day')
    resolveWeatherOverlayPhaseMock.mockImplementation((weatherText: string) =>
      weatherText.includes('多云')
        ? { kind: 'cloudy', layer: 'cloudy', isAlternating: false, isLightningActive: false }
        : { kind: 'snowy', layer: 'snowy', isAlternating: false, isLightningActive: false },
    )

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '武汉市',
        weatherText: '多云',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    expect(wrapper.find('[data-weather-overlay-layer="cloudy"]').exists()).toBe(true)

    await wrapper.setProps({
      weatherText: '小雪',
    })
    await nextTick()

    expect(wrapper.find('[data-weather-lightning-stage="active"]').exists()).toBe(false)
    expect(wrapper.find('[data-weather-overlay-layer="snowy"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-snow-stage="active"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-snow-group="back"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-snow-group="mid"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-snow-group="front"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-page-scroll"]').exists()).toBe(true)
  })

  it('renders structured snow layers when weather text is snowy', () => {
    resolveCityBackgroundMock.mockReturnValue('/assets/wuhan-day.jpg')
    getCityBackgroundVariantMock.mockReturnValue('day')
    resolveWeatherOverlayPhaseMock.mockReturnValue({
      kind: 'snowy',
      layer: 'snowy',
      isAlternating: false,
      isLightningActive: false,
    })

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '武汉市',
        weatherText: '中雪',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    expect(wrapper.find('[data-weather-snow-stage="active"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-snow-group="back"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-snow-group="mid"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-snow-group="front"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-page-scroll"]').exists()).toBe(true)
  })

  it('switches to lite mode for mobile viewport while keeping weather structures', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640,
    })
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMedia({
        '(max-width: 768px)': true,
        '(prefers-reduced-motion: reduce)': false,
      }),
    })

    resolveCityBackgroundMock.mockReturnValue('/assets/wuhan-day.jpg')
    getCityBackgroundVariantMock.mockReturnValue('day')
    resolveWeatherOverlayPhaseMock.mockReturnValue({
      kind: 'snowy',
      layer: 'snowy',
      isAlternating: false,
      isLightningActive: false,
    })

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '武汉市',
        weatherText: '中雪',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    await nextTick()

    expect(wrapper.attributes('data-weather-performance-mode')).toBe('lite')
    expect(wrapper.find('[data-weather-snow-stage="active"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-snow-group="back"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-snow-group="mid"]').exists()).toBe(true)
    expect(wrapper.find('[data-weather-snow-group="front"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-page-scroll"]').exists()).toBe(true)
  })
})
