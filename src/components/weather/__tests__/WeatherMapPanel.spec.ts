import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import WeatherMapPanel from '@/components/weather/WeatherMapPanel.vue'

const pushMock = vi.fn()
const destroyMock = vi.fn()
const setViewMock = vi.fn()
const clearMock = vi.fn()
const addGraphicMock = vi.fn()
const markerRemoveMock = vi.fn()
const markerSetLatLngMock = vi.fn()
const markerSetTooltipContentMock = vi.fn()
const baiduAddToMock = vi.fn()

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRouter: () => ({
      push: pushMock,
    }),
  }
})

vi.mock('mars2d', () => ({
  Map: vi.fn().mockImplementation(function MockMap() {
    return {
    destroy: destroyMock,
    setView: setViewMock,
    graphicLayer: {
      addGraphic: addGraphicMock,
      clear: clearMock,
    },
    }
  }),
  layer: {
    BaiduLayer: vi.fn().mockImplementation(function MockBaiduLayer() {
      return {
      addTo: baiduAddToMock,
      remove: vi.fn(),
      }
    }),
  },
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

describe('WeatherMapPanel', () => {
  beforeEach(() => {
    pushMock.mockReset()
    destroyMock.mockReset()
    setViewMock.mockReset()
    clearMock.mockReset()
    addGraphicMock.mockReset()
    markerRemoveMock.mockReset()
    markerSetLatLngMock.mockReset()
    markerSetTooltipContentMock.mockReset()
    baiduAddToMock.mockReset()
  })

  it('initializes the map when coordinates are available', async () => {
    const wrapper = mount(WeatherMapPanel, {
      props: {
        cityName: '武汉市',
        weatherText: '晴',
        province: '湖北省',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="weather-map-canvas"]').exists()).toBe(true)
    expect(addGraphicMock).toHaveBeenCalledTimes(1)
    expect(setViewMock).toHaveBeenCalled()
    expect(wrapper.text()).toContain('武汉市天气地图')
    expect(wrapper.text()).toContain('114.3055E')
  })

  it('navigates to the city map route when the preview card is clicked', async () => {
    const wrapper = mount(WeatherMapPanel, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await wrapper.trigger('click')

    expect(pushMock).toHaveBeenCalledWith({
      name: 'city-weather-map',
      params: { cityName: '武汉市' },
    })
  })

  it('updates map center and marker when city coordinates change', async () => {
    const wrapper = mount(WeatherMapPanel, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()
    setViewMock.mockClear()

    await wrapper.setProps({
      cityName: '上海市',
      latitude: 31.2304,
      longitude: 121.4737,
    })
    await flushPromises()

    expect(setViewMock).toHaveBeenCalledWith({
      lat: 31.2304,
      lng: 121.4737,
    }, 9, {
      animate: true,
    })
    expect(markerSetLatLngMock).toHaveBeenCalledWith([31.2304, 121.4737])
  })

  it('renders fallback content when coordinates are missing', () => {
    const wrapper = mount(WeatherMapPanel, {
      props: {
        cityName: '未知城市',
        latitude: null,
        longitude: null,
      },
    })

    expect(wrapper.text()).toContain('城市坐标暂不可用')
    expect(addGraphicMock).not.toHaveBeenCalled()
    expect(wrapper.find('.enter-chip').exists()).toBe(true)
  })

  it('destroys the map instance on unmount', async () => {
    const wrapper = mount(WeatherMapPanel, {
      props: {
        cityName: '武汉市',
        latitude: 30.5928,
        longitude: 114.3055,
      },
    })

    await flushPromises()
    wrapper.unmount()

    expect(destroyMock).toHaveBeenCalledTimes(1)
    expect(markerRemoveMock).toHaveBeenCalled()
  })
})
