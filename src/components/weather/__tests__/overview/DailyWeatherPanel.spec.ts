import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import DailyWeatherPanel from '@/components/weather/overview/DailyWeatherPanel.vue'

const { getDailyWeatherDetailMock } = vi.hoisted(() => ({
  getDailyWeatherDetailMock: vi.fn(),
}))

vi.mock('@/service/weather', async () => {
  const actual = await vi.importActual<typeof import('@/service/weather')>('@/service/weather')
  return {
    ...actual,
    getDailyWeatherDetail: getDailyWeatherDetailMock,
  }
})

describe('DailyWeatherPanel', () => {
  beforeEach(() => {
    getDailyWeatherDetailMock.mockReset()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-02T09:30:00+08:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders today by default and updates when switching date and period', async () => {
    getDailyWeatherDetailMock.mockResolvedValue({
      data: {
        cityId: 'city-1',
        cityName: '武汉市',
        source: 'open-meteo',
        items: [
          {
            date: '2026-05-01',
            temperatureMax: '28°C',
            temperatureMin: '19°C',
            sunrise: '05:35',
            sunset: '18:58',
            dayWeatherText: '晴',
            nightWeatherText: '多云',
            dayMetrics: {
              feelsLike: '29°C',
              precipitationProbability: '8%',
              precipitationAmount: '0.0 mm',
              airQuality: 'AQI 46',
              windDirection: '东南',
              cloudCover: '18%',
            },
            nightMetrics: {
              feelsLike: '22°C',
              precipitationProbability: '15%',
              precipitationAmount: '0.3 mm',
              airQuality: 'AQI 52',
              windDirection: '东北',
              cloudCover: '34%',
            },
          },
          {
            date: '2026-05-02',
            temperatureMax: '31°C',
            temperatureMin: '22°C',
            sunrise: '05:34',
            sunset: '18:59',
            dayWeatherText: '晴',
            nightWeatherText: '小雨',
            dayMetrics: {
              feelsLike: '33°C',
              precipitationProbability: '12%',
              precipitationAmount: '0.1 mm',
              airQuality: 'AQI 61',
              windDirection: '南',
              cloudCover: '26%',
            },
            nightMetrics: {
              feelsLike: '25°C',
              precipitationProbability: '48%',
              precipitationAmount: '2.4 mm',
              airQuality: 'AQI 63',
              windDirection: '西南',
              cloudCover: '68%',
            },
          },
          {
            date: '2026-05-03',
            temperatureMax: '24°C',
            temperatureMin: '17°C',
            sunrise: '05:33',
            sunset: '19:00',
            dayWeatherText: '小雨',
            nightWeatherText: '多云',
            dayMetrics: {
              feelsLike: '23°C',
              precipitationProbability: '--',
              precipitationAmount: '--',
              airQuality: 'AQI 55',
              windDirection: '北',
              cloudCover: '74%',
            },
            nightMetrics: {
              feelsLike: '18°C',
              precipitationProbability: '22%',
              precipitationAmount: '0.6 mm',
              airQuality: 'AQI 50',
              windDirection: '西北',
              cloudCover: '52%',
            },
          },
        ],
      },
    })

    const wrapper = mount(DailyWeatherPanel, {
      props: {
        city: {
          cityId: 'city-1',
          cityName: '武汉市',
          weatherText: '晴',
          temperature: '26°C',
        },
      },
    })

    await flushPromises()

    expect(getDailyWeatherDetailMock).toHaveBeenCalledWith('city-1')
    expect(wrapper.text()).toContain('5月2日星期六')
    expect(wrapper.text()).toContain('31°C')
    expect(wrapper.text()).toContain('22°C')
    expect(wrapper.text()).toContain('05:34')
    expect(wrapper.text()).toContain('18:59')
    expect(wrapper.get('[data-testid="daily-weather-sunrise-icon"]').attributes('alt')).toBe('日出图标')
    expect(wrapper.get('[data-testid="daily-weather-sunset-icon"]').attributes('alt')).toBe('日落图标')
    expect(wrapper.get('.hero-card').classes()).toContain('is-day-mode')
    expect(wrapper.get('[data-testid="daily-weather-period-mark-day"]').text()).toBe('白天态势')
    expect(wrapper.get('[data-testid="daily-weather-metric-feelsLike"]').text()).toContain('33°C')
    expect(wrapper.get('[data-testid="daily-weather-metric-windDirection"]').text()).toContain('南')
    expect(wrapper.get('[data-testid="daily-weather-metric-icon-feelsLike"]').attributes('alt')).toBe('体感温度图标')
    expect(wrapper.get('[data-testid="daily-weather-metric-icon-precipitationProbability"]').attributes('alt')).toBe('降水概率图标')
    expect(wrapper.get('[data-testid="daily-weather-metric-icon-precipitationAmount"]').attributes('alt')).toBe('降水量图标')
    expect(wrapper.get('[data-testid="daily-weather-metric-icon-airQuality"]').attributes('alt')).toBe('空气质量图标')
    expect(wrapper.get('[data-testid="daily-weather-metric-icon-windDirection"]').attributes('alt')).toBe('风向图标')
    expect(wrapper.get('[data-testid="daily-weather-metric-icon-cloudCover"]').attributes('alt')).toBe('云量图标')

    const periodButtons = wrapper.findAll('.period-chip')
    await periodButtons[1]!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('小雨')
    expect(wrapper.get('.hero-card').classes()).toContain('is-night-mode')
    expect(wrapper.get('[data-testid="daily-weather-period-mark-night"]').text()).toBe('夜间态势')
    expect(wrapper.get('[data-testid="daily-weather-metric-precipitationAmount"]').text()).toContain('2.4 mm')
    expect(wrapper.get('[data-testid="daily-weather-metric-windDirection"]').text()).toContain('西南')

    const arrowButtons = wrapper.findAll('.arrow-button')
    await arrowButtons[1]!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('5月3日星期日')
    expect(wrapper.get('[data-testid="daily-weather-metric-precipitationProbability"]').text()).toContain('22%')
    expect(wrapper.get('[data-testid="daily-weather-metric-windDirection"]').text()).toContain('西北')
  })

  it('shows placeholder values when metrics are missing and disables out-of-range arrows', async () => {
    getDailyWeatherDetailMock.mockResolvedValue({
      data: {
        cityId: 'city-1',
        cityName: '武汉市',
        source: 'open-meteo',
        items: [
          {
            date: '2026-05-02',
            temperatureMax: '30°C',
            temperatureMin: '20°C',
            sunrise: '--',
            sunset: '--',
            dayWeatherText: '多云',
            nightWeatherText: '多云',
            dayMetrics: {
              feelsLike: '--',
              precipitationProbability: '--',
              precipitationAmount: '--',
              airQuality: '--',
              windDirection: '--',
              cloudCover: '--',
            },
            nightMetrics: {
              feelsLike: '--',
              precipitationProbability: '--',
              precipitationAmount: '--',
              airQuality: '--',
              windDirection: '--',
              cloudCover: '--',
            },
          },
        ],
      },
    })

    const wrapper = mount(DailyWeatherPanel, {
      props: {
        city: {
          cityId: 'city-1',
          cityName: '武汉市',
          weatherText: '晴',
          temperature: '26°C',
        },
      },
    })

    await flushPromises()

    const arrowButtons = wrapper.findAll('.arrow-button')
    expect(arrowButtons[0]!.attributes('disabled')).toBeDefined()
    expect(arrowButtons[1]!.attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="daily-weather-metric-airQuality"]').text()).toContain('--')
    expect(wrapper.get('[data-testid="daily-weather-metric-icon-airQuality"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('--')
  })
})
