import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import WeatherCityOverview from '@/components/weather/overview/WeatherCityOverview.vue'
import {
  getCurrentWeather,
  getDailyWeather,
  getHourlyWeather,
} from '@/service/weather'

const bundledWeather = {
  current: {
    cityId: 'city-3',
    cityName: '杭州市',
    weatherText: '阴',
    temperature: '21°C',
    apparentTemperature: '22°C',
    windDirection: '东南',
    windSpeed: '9.8 km/h',
    humidity: '66%',
    visibility: '10.0 公里',
    pressure: '1008 hPa',
    dewPoint: '18°C',
    precipitationProbability: '12%',
    precipitationAmount: '0.1 mm',
    cloudCover: '78%',
    airQuality: 'AQI 36',
    observedAt: '2026-05-04T09:00',
    source: 'open-meteo',
  },
  hourly: {
    cityId: 'city-3',
    cityName: '杭州市',
    source: 'open-meteo',
    items: [
      {
        time: '2026-05-04T10:00',
        weatherText: '阴',
        temperature: '22°C',
      },
    ],
  },
  daily: {
    cityId: 'city-3',
    cityName: '杭州市',
    source: 'open-meteo',
    items: [
      {
        date: '2026-05-04',
        weatherText: '阴',
        temperatureMax: '25°C',
        temperatureMin: '18°C',
      },
    ],
  },
  dailyDetail: {
    cityId: 'city-3',
    cityName: '杭州市',
    source: 'open-meteo',
    items: [],
  },
}

const buildBundledWeather = (cityId: string, cityName: string) => ({
  ...bundledWeather,
  current: {
    ...bundledWeather.current,
    cityId,
    cityName,
    weatherText: cityName === '南昌市' ? '晴' : '小雨',
    temperature: cityName === '南昌市' ? '29°C' : '24°C',
    humidity: cityName === '南昌市' ? '61%' : '78%',
    airQuality: cityName === '南昌市' ? 'AQI 40' : 'AQI 42',
  },
  hourly: {
    ...bundledWeather.hourly,
    cityId,
    cityName,
  },
  daily: {
    ...bundledWeather.daily,
    cityId,
    cityName,
  },
  dailyDetail: {
    ...bundledWeather.dailyDetail,
    cityId,
    cityName,
  },
})

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

  it('renders bundled city weather before backend refresh completes', async () => {
    const currentPromise = new Promise(() => {})
    vi.mocked(getCurrentWeather).mockReturnValueOnce(currentPromise as never)
    vi.mocked(getHourlyWeather).mockReturnValueOnce(currentPromise as never)
    vi.mocked(getDailyWeather).mockReturnValueOnce(currentPromise as never)

    const wrapper = mount(WeatherCityOverview, {
      props: {
        navItems: [],
        activeNavKey: 'overview',
        cities: [
          {
            cityId: 'city-3',
            cityName: '杭州市',
            province: '浙江省',
            weatherText: '多云',
            temperature: '20°C',
            weather: bundledWeather,
          },
        ],
        defaultCityName: '杭州市',
        selectedCityName: '杭州市',
        temperature: '20°C',
        weatherText: '多云',
      },
      global: {
        stubs: {
          WeatherDetailHeader: true,
          WeatherCityTabs: true,
          HourlyForecastPanel: {
            props: ['hourlyItems'],
            template: '<div class="hourly-count">{{ hourlyItems.length }}</div>',
          },
          CurrentWeatherPanel: {
            props: ['currentWeather'],
            template: '<div class="current-air-quality">{{ currentWeather?.airQuality }}</div>',
          },
          WeatherMapPanel: {
            props: ['weatherText'],
            template: '<div class="map-weather-text">{{ weatherText }}</div>',
          },
        },
      },
    })

    expect(wrapper.find('.current-air-quality').text()).toBe('AQI 36')
    expect(wrapper.find('.hourly-count').text()).toBe('1')
    expect(wrapper.find('.map-weather-text').text()).toBe('阴')
  })

  it('keeps bundled city weather when backend refresh fails', async () => {
    vi.mocked(getCurrentWeather).mockRejectedValueOnce(new Error('network'))
    vi.mocked(getHourlyWeather).mockRejectedValueOnce(new Error('network'))
    vi.mocked(getDailyWeather).mockRejectedValueOnce(new Error('network'))

    const wrapper = mount(WeatherCityOverview, {
      props: {
        navItems: [],
        activeNavKey: 'overview',
        cities: [
          {
            cityId: 'city-3',
            cityName: '杭州市',
            province: '浙江省',
            weatherText: '多云',
            temperature: '20°C',
            weather: bundledWeather,
          },
        ],
        defaultCityName: '杭州市',
        selectedCityName: '杭州市',
        temperature: '20°C',
        weatherText: '多云',
      },
      global: {
        stubs: {
          WeatherDetailHeader: true,
          WeatherCityTabs: true,
          HourlyForecastPanel: {
            props: ['hourlyItems'],
            template: '<div class="hourly-count">{{ hourlyItems.length }}</div>',
          },
          CurrentWeatherPanel: {
            props: ['currentWeather'],
            template: '<div class="current-air-quality">{{ currentWeather?.airQuality }}</div>',
          },
          WeatherMapPanel: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('.current-air-quality').text()).toBe('AQI 36')
    expect(wrapper.find('.hourly-count').text()).toBe('1')
  })

  it('keeps refreshed current weather when hourly and daily refreshes fail', async () => {
    vi.mocked(getCurrentWeather).mockResolvedValueOnce({
      data: {
        cityId: 'city-3',
        cityName: '杭州市',
        weatherText: '小雨',
        temperature: '23°C',
        apparentTemperature: '24°C',
        windDirection: '东北',
        windSpeed: '12.1 km/h',
        humidity: '70%',
        visibility: '11.0 公里',
        pressure: '1009 hPa',
        dewPoint: '19°C',
        precipitationProbability: '28%',
        precipitationAmount: '0.4 mm',
        cloudCover: '82%',
        airQuality: 'AQI 44',
        observedAt: '2026-05-04T10:00',
        source: 'open-meteo',
      },
    })
    vi.mocked(getHourlyWeather).mockRejectedValueOnce(new Error('network'))
    vi.mocked(getDailyWeather).mockRejectedValueOnce(new Error('network'))

    const wrapper = mount(WeatherCityOverview, {
      props: {
        navItems: [],
        activeNavKey: 'overview',
        cities: [
          {
            cityId: 'city-3',
            cityName: '杭州市',
            province: '浙江省',
            weatherText: '多云',
            temperature: '20°C',
            weather: bundledWeather,
          },
        ],
        defaultCityName: '杭州市',
        selectedCityName: '杭州市',
        temperature: '20°C',
        weatherText: '多云',
      },
      global: {
        stubs: {
          WeatherDetailHeader: true,
          WeatherCityTabs: true,
          HourlyForecastPanel: {
            props: ['hourlyItems'],
            template: '<div class="hourly-count">{{ hourlyItems.length }}</div>',
          },
          CurrentWeatherPanel: {
            props: ['currentWeather'],
            template: '<div class="current-air-quality">{{ currentWeather?.airQuality }}</div>',
          },
          WeatherMapPanel: {
            props: ['weatherText'],
            template: '<div class="map-weather-text">{{ weatherText }}</div>',
          },
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('.current-air-quality').text()).toBe('AQI 44')
    expect(wrapper.find('.hourly-count').text()).toBe('1')
    expect(wrapper.find('.map-weather-text').text()).toBe('小雨')
  })

  it.each([
    ['武汉市', 'city-wuhan', '78%', 'AQI 42'],
    ['南昌市', 'city-nanchang', '61%', 'AQI 40'],
  ])('renders bundled weather details for existing city %s before refresh completes', async (
    cityName,
    cityId,
    humidity,
    airQuality,
  ) => {
    const pendingPromise = new Promise(() => {})
    vi.mocked(getCurrentWeather).mockReturnValueOnce(pendingPromise as never)
    vi.mocked(getHourlyWeather).mockReturnValueOnce(pendingPromise as never)
    vi.mocked(getDailyWeather).mockReturnValueOnce(pendingPromise as never)

    const wrapper = mount(WeatherCityOverview, {
      props: {
        navItems: [],
        activeNavKey: 'overview',
        cities: [
          {
            cityId,
            cityName,
            province: cityName === '南昌市' ? '江西省' : '湖北省',
            weatherText: '多云',
            temperature: '20°C',
            weather: buildBundledWeather(cityId, cityName),
          },
        ],
        defaultCityName: cityName,
        selectedCityName: cityName,
        temperature: '20°C',
        weatherText: '多云',
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
                <span class="current-humidity">{{ currentWeather?.humidity }}</span>
                <span class="current-air-quality">{{ currentWeather?.airQuality }}</span>
              </div>
            `,
          },
          WeatherMapPanel: true,
        },
      },
    })

    expect(wrapper.find('.current-humidity').text()).toBe(humidity)
    expect(wrapper.find('.current-air-quality').text()).toBe(airQuality)
  })
})
