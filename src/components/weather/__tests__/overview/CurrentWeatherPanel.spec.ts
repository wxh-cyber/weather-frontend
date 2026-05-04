import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CurrentWeatherPanel from '@/components/weather/overview/CurrentWeatherPanel.vue'

describe('CurrentWeatherPanel', () => {
  it('renders supported current weather metrics from backend data', () => {
    const wrapper = mount(CurrentWeatherPanel, {
      props: {
        cityName: '武汉市',
        temperature: '26°C',
        weatherText: '小雨',
        currentWeather: {
          cityId: 'city-1',
          cityName: '武汉市',
          weatherText: '小雨',
          temperature: '26°C',
          apparentTemperature: '28°C',
          precipitationProbability: '35%',
          precipitationAmount: '0.8 mm',
          cloudCover: '62%',
          windDirection: '东北',
          windSpeed: '16.2 km/h',
          humidity: '78%',
          visibility: '12.0 公里',
          pressure: '1009 hPa',
          dewPoint: '21°C',
          airQuality: 'AQI 42',
          observedAt: '2026-05-04T10:00',
          source: 'open-meteo',
        },
      },
    })

    expect(wrapper.text()).toContain('AQI 42')
    expect(wrapper.text()).toContain('东北 16.2 km/h')
    expect(wrapper.text()).toContain('35%')
    expect(wrapper.text()).toContain('0.8 mm')
    expect(wrapper.text()).toContain('62%')
    expect(wrapper.text()).toContain('10:00')
    expect(wrapper.text()).toContain('open-meteo')
    expect(wrapper.text()).not.toContain('湿度')
    expect(wrapper.text()).not.toContain('能见度')
    expect(wrapper.text()).not.toContain('气压')
    expect(wrapper.text()).not.toContain('露点')
  })

  it('uses empty placeholders instead of generated fallback values when backend fields are missing', () => {
    const wrapper = mount(CurrentWeatherPanel, {
      props: {
        cityName: '武汉市',
        temperature: '26°C',
        weatherText: '晴',
        currentWeather: null,
      },
    })

    expect(wrapper.text()).toContain('体感温度 --')
    expect(wrapper.findAll('.metric strong').every((item) => item.text() === '--')).toBe(true)
    expect(wrapper.findAll('.metric')).toHaveLength(5)
    expect(wrapper.text()).not.toContain('东北风')
  })
})
