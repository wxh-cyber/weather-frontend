import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import WeatherMapExplorer from '@/components/weather/map/WeatherMapExplorer.vue'

let currentZoom = 9
const mapEventHandlers = new Map<string, ((event?: any) => void)>()
const { reverseGeocodeMock } = vi.hoisted(() => ({
  reverseGeocodeMock: vi.fn(),
}))

const destroyMock = vi.fn()
const setViewMock = vi.fn()
const setZoomMock = vi.fn()
const latLngToContainerPointMock = vi.fn()
const addGraphicMock = vi.fn()
const markerRemoveMock = vi.fn()
const markerSetLatLngMock = vi.fn()
const markerSetTooltipContentMock = vi.fn()
const layerAddToMock = vi.fn()
const layerRemoveMock = vi.fn()
const layerOnMock = vi.fn()
const layerOffMock = vi.fn()
const offMock = vi.fn()
const onMock = vi.fn()

vi.mock('@/components/weather/map/mapTheme', () => ({
  createEcoBasemapLayer: vi.fn(() => ({
    addTo: layerAddToMock,
    remove: layerRemoveMock,
    on: layerOnMock,
    off: layerOffMock,
  })),
}))

vi.mock('@/service/weather', () => ({
  getReverseGeocode: reverseGeocodeMock,
}))

vi.mock('mars2d', () => ({
  Map: vi.fn().mockImplementation(function MockMap() {
    return {
      destroy: destroyMock,
      setView: setViewMock,
      setZoom: setZoomMock,
      getZoom: () => currentZoom,
      latLngToContainerPoint: latLngToContainerPointMock,
      on: onMock,
      off: offMock,
      graphicLayer: {
        addGraphic: addGraphicMock,
      },
    }
  }),
  graphic: {
    Marker: vi.fn().mockImplementation(function MockMarker() {
      return {
        remove: markerRemoveMock,
        setLatLng: markerSetLatLngMock,
        setTooltipContent: markerSetTooltipContentMock,
      }
    }),
  },
}))

describe('WeatherMapExplorer', () => {
  beforeEach(() => {
    vi.useRealTimers()
    currentZoom = 9
    mapEventHandlers.clear()
    destroyMock.mockReset()
    setViewMock.mockReset()
    setZoomMock.mockReset()
    latLngToContainerPointMock.mockReset()
    addGraphicMock.mockReset()
    markerRemoveMock.mockReset()
    markerSetLatLngMock.mockReset()
    markerSetTooltipContentMock.mockReset()
    layerAddToMock.mockReset()
    layerRemoveMock.mockReset()
    layerOnMock.mockReset()
    layerOffMock.mockReset()
    reverseGeocodeMock.mockReset()
    offMock.mockReset()
    onMock.mockReset()
    latLngToContainerPointMock.mockReturnValue({ x: 180, y: 120 })
    reverseGeocodeMock.mockResolvedValue({
      code: 0,
      message: '地点名称解析成功',
      data: {
        displayName: '上海市 · 黄浦区 · 外滩',
        latitude: 31.2304,
        longitude: 121.4737,
      },
    })
    onMock.mockImplementation((event: string, handler: (event?: any) => void) => {
      mapEventHandlers.set(event, handler)
    })
    setZoomMock.mockImplementation((zoom: number) => {
      currentZoom = zoom
      mapEventHandlers.get('zoomend')?.()
    })
  })

  it('initializes the map with coordinates and renders scale frame', async () => {
    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        province: '湖北省',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="weather-map-explorer-canvas"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="map-scale-frame"]').exists()).toBe(true)
    expect(addGraphicMock).toHaveBeenCalledTimes(1)
    expect(setViewMock).toHaveBeenCalled()
    expect(wrapper.find('[data-testid="map-center-pin"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('武汉市 城市地图')
    expect(wrapper.findAll('.weather-layer-btn')).toHaveLength(3)
    expect(wrapper.findAll('.weather-layer-btn__icon')).toHaveLength(3)
  })

  it('shows overlay preview on hover and toggles precipitation and cloud layers on click', async () => {
    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()

    const buttons = wrapper.findAll('.weather-layer-btn')
    await buttons[0]!.trigger('mouseenter')
    await flushPromises()

    expect(wrapper.find('[data-testid="weather-overlay-precipitation"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-overlay-legend"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="weather-precipitation-timeline"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-precipitation-bottom-bar"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-precipitation-bottom-status"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-precipitation-bottom-scale"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="weather-precipitation-rainfall-layer"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-precipitation-splash-layer"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-precipitation-zoom-console"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="map-console-stack"]').exists()).toBe(true)
    expect(wrapper.findAll('.weather-overlay-region__core').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.weather-overlay-region__merged').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.weather-overlay-region__accent').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.weather-overlay-region__texture').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.weather-precipitation-rainfall-drop').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.weather-precipitation-splash').length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('PRECIPITATION MAP')
    expect(wrapper.text()).toContain('现在')
    expect(wrapper.text()).toContain('30分钟后')
    expect(wrapper.text()).toContain('1小时后')

    await buttons[0]!.trigger('click')
    await flushPromises()
    expect(buttons[0]!.classes()).toContain('is-active')

    await buttons[0]!.trigger('mouseleave')
    await flushPromises()
    expect(wrapper.find('[data-testid="weather-overlay-precipitation"]').exists()).toBe(true)

    await buttons[1]!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="weather-overlay-cloud"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-precipitation-timeline"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="weather-precipitation-bottom-bar"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="weather-precipitation-rainfall-layer"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="weather-precipitation-splash-layer"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('CLOUD DENSITY SCAN')
    expect(buttons[1]!.classes()).toContain('is-active')
  })

  it('shows wind overlay, flow legend and regional wind markers when wind layer is activated', async () => {
    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()

    const buttons = wrapper.findAll('.weather-layer-btn')
    await buttons[2]!.trigger('mouseenter')
    await flushPromises()

    expect(wrapper.find('[data-testid="weather-overlay-wind"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-wind-direction"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-global-wind-field"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('WIND FIELD SCAN')
    expect(wrapper.findAll('.weather-global-wind-field__stream').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.weather-global-wind-field__highlight').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.weather-overlay-region__wind-flow').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.weather-overlay-region__marker').length).toBeGreaterThan(0)
  })

  it('keeps overlay rendering after zoom changes so weather regions stay synchronized', async () => {
    vi.useFakeTimers()
    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()

    const buttons = wrapper.findAll('.weather-layer-btn')
    await buttons[0]!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="weather-overlay-precipitation"]').exists()).toBe(true)

    mapEventHandlers.get('zoomstart')?.()
    await flushPromises()

    expect(wrapper.find('[data-testid="weather-overlay-precipitation"]').attributes('data-precipitation-settling')).toBe('true')
    expect(wrapper.find('[data-testid="weather-precipitation-rainfall-layer"]').attributes('data-precipitation-settling')).toBe('true')
    expect(wrapper.find('[data-testid="weather-precipitation-splash-layer"]').attributes('data-precipitation-settling')).toBe('true')

    await wrapper.find('[data-testid="map-zoom-slider"]').setValue('12')
    await flushPromises()

    expect(setZoomMock).toHaveBeenLastCalledWith(12, { animate: true })
    expect(wrapper.find('[data-testid="weather-overlay-precipitation"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-precipitation-zoom-console"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weather-precipitation-zoom-console"]').attributes('data-precipitation-settling')).toBe('true')
    expect(wrapper.findAll('.weather-overlay-region__core').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.weather-overlay-region__halo').length).toBeGreaterThan(0)

    vi.advanceTimersByTime(220)
    await flushPromises()

    expect(wrapper.find('[data-testid="weather-overlay-precipitation"]').attributes('data-precipitation-settling')).toBe('false')
    expect(wrapper.find('[data-testid="weather-precipitation-rainfall-layer"]').attributes('data-precipitation-settling')).toBe('false')
    expect(wrapper.find('[data-testid="weather-precipitation-splash-layer"]').attributes('data-precipitation-settling')).toBe('false')
  })

  it('reprojects overlay regions after map movement so weather layers stay aligned', async () => {
    latLngToContainerPointMock
      .mockReturnValueOnce({ x: 180, y: 120 })
      .mockReturnValueOnce({ x: 220, y: 132 })
      .mockReturnValueOnce({ x: 164, y: 178 })
      .mockReturnValueOnce({ x: 236, y: 204 })
      .mockReturnValue({ x: 260, y: 216 })

    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()

    const buttons = wrapper.findAll('.weather-layer-btn')
    await buttons[0]!.trigger('click')
    await flushPromises()

    const beforeMovePath = wrapper.find('.weather-overlay-region__core').attributes('d')
    expect(beforeMovePath).toBeTruthy()

    latLngToContainerPointMock.mockImplementation(({ lat, lng }: { lat: number; lng: number }) => ({
      x: Number((lng * 4.4).toFixed(2)),
      y: Number((lat * 5.2).toFixed(2)),
    }))

    mapEventHandlers.get('moveend')?.()
    await flushPromises()

    const afterMovePath = wrapper.find('.weather-overlay-region__core').attributes('d')
    expect(afterMovePath).toBeTruthy()
    expect(afterMovePath).not.toBe(beforeMovePath)
    expect(wrapper.find('[data-testid="weather-overlay-precipitation"]').exists()).toBe(true)
  })

  it('locks onto the clicked map point and refocuses the view', async () => {
    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()
    setViewMock.mockClear()

    mapEventHandlers.get('click')?.({
      latlng: {
        lat: 31.2304,
        lng: 121.4737,
      },
    })
    await flushPromises()

    expect(setViewMock).toHaveBeenCalledWith(
      {
        lat: 31.2304,
        lng: 121.4737,
      },
      9,
      { animate: true },
    )
    expect(reverseGeocodeMock).toHaveBeenCalledWith(31.2304, 121.4737)
    expect(addGraphicMock).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="map-target-lock"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="map-center-pin"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('TARGET LOCKED')
    expect(wrapper.text()).toContain('上海市 · 黄浦区 · 外滩')
    expect(wrapper.text()).toContain('121.4737E · 31.2304N')
  })

  it('shows locked target summary inside the precipitation bottom bar', async () => {
    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()

    const buttons = wrapper.findAll('.weather-layer-btn')
    await buttons[0]!.trigger('click')
    await flushPromises()

    mapEventHandlers.get('click')?.({
      latlng: {
        lat: 31.2304,
        lng: 121.4737,
      },
    })
    await flushPromises()

    const statusBar = wrapper.find('[data-testid="weather-precipitation-bottom-status"]')
    expect(statusBar.exists()).toBe(true)
    expect(statusBar.text()).toContain('上海市 · 黄浦区 · 外滩')
    expect(statusBar.text()).toContain('121.4737E · 31.2304N')
  })

  it('falls back to coordinates when place resolution fails', async () => {
    reverseGeocodeMock.mockRejectedValueOnce(new Error('network failed'))

    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()

    mapEventHandlers.get('click')?.({
      latlng: {
        lat: 22.5431,
        lng: 114.0579,
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('名称解析失败，已回退坐标')
    expect(wrapper.text()).toContain('114.0579E · 22.5431N')
  })

  it('renders the resolved place name when backend fallback provider returns a location', async () => {
    reverseGeocodeMock.mockResolvedValueOnce({
      code: 0,
      message: '地点名称解析成功',
      data: {
        displayName: '广东省 · 广州市 · 天河区 · 天河路208号',
        latitude: 23.1291,
        longitude: 113.2644,
      },
    })

    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '广州市',
        latitude: 23.1291,
        longitude: 113.2644,
      },
    })

    await flushPromises()

    mapEventHandlers.get('click')?.({
      latlng: {
        lat: 23.1291,
        lng: 113.2644,
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('广东省 · 广州市 · 天河区 · 天河路208号')
    expect(wrapper.text()).not.toContain('名称解析失败，已回退坐标')
  })

  it('keeps only the latest place name when clicks happen in quick succession', async () => {
    let firstResolve: ((value: unknown) => void) | undefined
    let secondResolve: ((value: unknown) => void) | undefined
    reverseGeocodeMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            firstResolve = resolve
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            secondResolve = resolve
          }),
      )

    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()

    mapEventHandlers.get('click')?.({
      latlng: {
        lat: 31.2304,
        lng: 121.4737,
      },
    })
    mapEventHandlers.get('click')?.({
      latlng: {
        lat: 39.9042,
        lng: 116.4074,
      },
    })

    secondResolve?.({
      code: 0,
      message: '地点名称解析成功',
      data: {
        displayName: '北京市 · 东城区',
        latitude: 39.9042,
        longitude: 116.4074,
      },
    })
    await flushPromises()

    firstResolve?.({
      code: 0,
      message: '地点名称解析成功',
      data: {
        displayName: '上海市 · 黄浦区 · 外滩',
        latitude: 31.2304,
        longitude: 121.4737,
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('北京市 · 东城区')
    expect(wrapper.text()).not.toContain('上海市 · 黄浦区 · 外滩')
    expect(wrapper.text()).toContain('116.4074E · 39.9042N')
  })

  it('zooms with plus and minus actions', async () => {
    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()

    const buttons = wrapper.findAll('.zoom-btn')
    await buttons[1]!.trigger('click')
    await flushPromises()
    expect(setZoomMock).toHaveBeenLastCalledWith(10, { animate: true })

    await buttons[0]!.trigger('click')
    await flushPromises()
    expect(setZoomMock).toHaveBeenLastCalledWith(9, { animate: true })
  })

  it('updates zoom percent when dragging the slider', async () => {
    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()
    await wrapper.find('[data-testid="map-zoom-slider"]').setValue('16')
    await flushPromises()

    expect(setZoomMock).toHaveBeenLastCalledWith(16, { animate: true })
    expect(wrapper.find('[data-testid="map-zoom-percent"]').text()).toBe('100%')
  })

  it('keeps precipitation zoom console aligned with the default console footprint', async () => {
    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()

    const initialConsole = wrapper.find('.zoom-console')
    expect(initialConsole.classes()).not.toContain('zoom-console--precipitation')
    expect(wrapper.find('[data-testid="map-console-stack"]').classes()).not.toContain('map-console-stack--precipitation')

    const buttons = wrapper.findAll('.weather-layer-btn')
    await buttons[0]!.trigger('click')
    await flushPromises()

    const precipitationConsole = wrapper.find('[data-testid="weather-precipitation-zoom-console"]')
    expect(precipitationConsole.exists()).toBe(true)
    expect(precipitationConsole.classes()).toContain('zoom-console--precipitation')
    expect(precipitationConsole.classes()).not.toContain('zoom-console--seamless')
    expect(wrapper.find('[data-testid="map-console-stack"]').classes()).not.toContain('map-console-stack--precipitation')
    expect(wrapper.find('[data-testid="map-zoom-slider"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="map-zoom-percent"]').exists()).toBe(true)
  })

  it('renders fallback content when coordinates are missing', () => {
    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '未知城市',
        latitude: null,
        longitude: null,
      },
    })

    expect(wrapper.text()).toContain('城市坐标暂不可用')
    expect(addGraphicMock).not.toHaveBeenCalled()
  })

  it('destroys the map on unmount', async () => {
    const wrapper = mount(WeatherMapExplorer, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()
    wrapper.unmount()

    expect(destroyMock).toHaveBeenCalledTimes(1)
    expect(offMock).toHaveBeenCalled()
    expect(markerRemoveMock).toHaveBeenCalled()
  })
})
