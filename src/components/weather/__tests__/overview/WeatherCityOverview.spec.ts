import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import WeatherCityOverview from '@/components/weather/overview/WeatherCityOverview.vue'
import {
  getCurrentWeather,
  getDailyWeather,
  getHourlyWeather,
} from '@/service/weather'

vi.mock('@/service/weather', () => ({
  getCurrentWeather: vi.fn(async () => ({
    data: {
      cityId: 'city-1',
      cityName: '武汉市',
      weatherText: '小雨',
      temperature: '24°C',
      apparentTemperature: '25°C',
      windDirection: '东北',
      windSpeed: '16.2 km/h',
      humidity: '78%',
      visibility: '12.0 公里',
      pressure: '1009 hPa',
      dewPoint: '21°C',
      precipitationProbability: '35%',
      precipitationAmount: '0.8 mm',
      cloudCover: '62%',
      airQuality: 'AQI 42',
      observedAt: '2026-05-04T08:00',
      source: 'open-meteo',
    },
  })),
  getHourlyWeather: vi.fn(async () => ({ data: { items: [] } })),
  getDailyWeather: vi.fn(async () => ({ data: { items: [] } })),
}))

describe('WeatherCityOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests backend weather data when the selected city has a city id', async () => {
    const wrapper = mount(WeatherCityOverview, {
      props: {
        navItems: [],
        activeNavKey: 'overview',
        cities: [
          {
            cityId: 'city-1',
            cityName: '武汉市',
            weatherText: '晴',
            temperature: '26°C',
            latitude: 30.5928,
            longitude: 114.3055,
          },
        ],
        defaultCityName: '武汉市',
        selectedCityName: '武汉市',
        temperature: '26°C',
        weatherText: '晴',
      },
      global: {
        stubs: {
          WeatherDetailHeader: true,
          WeatherCityTabs: true,
          HourlyForecastPanel: true,
          CurrentWeatherPanel: {
            props: ['currentWeather'],
            template: `
              <div>
                <div class="current-humidity">{{ currentWeather?.humidity }}</div>
                <div class="current-wind">{{ currentWeather?.windDirection }} {{ currentWeather?.windSpeed }}</div>
                <div class="current-precipitation">{{ currentWeather?.precipitationProbability }}</div>
                <div class="current-cloud">{{ currentWeather?.cloudCover }}</div>
              </div>
            `,
          },
          WeatherMapPanel: {
            props: ['weatherText'],
            template: '<div class="map-weather-text">{{ weatherText }}</div>',
          },
        },
      },
    })

    await flushPromises()

    expect(getCurrentWeather).toHaveBeenCalledWith('city-1')
    expect(getHourlyWeather).toHaveBeenCalledWith('city-1')
    expect(getDailyWeather).toHaveBeenCalledWith('city-1')
    expect(wrapper.find('.current-humidity').text()).toBe('78%')
    expect(wrapper.find('.current-wind').text()).toBe('东北 16.2 km/h')
    expect(wrapper.find('.current-precipitation').text()).toBe('35%')
    expect(wrapper.find('.current-cloud').text()).toBe('62%')
    expect(wrapper.find('.map-weather-text').text()).toBe('小雨')
  })

  it('falls back to a matching city entry with city id when the selected row is a legacy cache item', async () => {
    const wrapper = mount(WeatherCityOverview, {
      props: {
        navItems: [],
        activeNavKey: 'overview',
        cities: [
          {
            cityName: '武汉市',
            weatherText: '晴',
            temperature: '26°C',
          },
          {
            cityId: 'city-1',
            cityName: '武汉市',
            province: '湖北省',
            latitude: 30.5928,
            longitude: 114.3055,
            weatherText: '小雨',
            temperature: '24°C',
          },
        ],
        defaultCityName: '武汉市',
        selectedCityName: '武汉市',
        temperature: '26°C',
        weatherText: '晴',
      },
      global: {
        stubs: {
          WeatherDetailHeader: true,
          WeatherCityTabs: true,
          HourlyForecastPanel: true,
          CurrentWeatherPanel: {
            props: ['currentWeather'],
            template: '<div class="current-air-quality">{{ currentWeather?.airQuality }}</div>',
          },
          WeatherMapPanel: {
            props: ['province'],
            template: '<div class="map-province">{{ province }}</div>',
          },
        },
      },
    })

    await flushPromises()

    expect(getCurrentWeather).toHaveBeenCalledWith('city-1')
    expect(wrapper.find('.current-air-quality').text()).toBe('AQI 42')
    expect(wrapper.find('.map-province').text()).toBe('湖北省')
  })
})
