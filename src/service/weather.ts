import http from './http'

export interface ReverseGeocodeData {
  displayName: string
  name?: string
  district?: string
  city?: string
  province?: string
  country?: string
  latitude: number
  longitude: number
}

export interface ReverseGeocodeResponse {
  code: number
  message: string
  data: ReverseGeocodeData
}

export interface DayPeriodMetrics {
  feelsLike: string
  precipitationProbability: string
  precipitationAmount: string
  airQuality: string
  windDirection: string
  cloudCover: string
}

export interface WeatherCurrentData {
  cityId: string
  cityName: string
  weatherText: string
  temperature: string
  apparentTemperature?: string
  precipitationProbability?: string
  precipitationAmount?: string
  cloudCover?: string
  windDirection?: string
  windSpeed?: string
  humidity?: string
  visibility?: string
  pressure?: string
  dewPoint?: string
  airQuality?: string
  observedAt: string
  source: string
}

export interface WeatherHourlyItem {
  time: string
  temperature: string
  weatherText: string
  apparentTemperature?: string
  precipitationProbability?: string
  precipitationAmount?: string
  cloudCover?: string
  windDirection?: string
  windSpeed?: string
  humidity?: string
  visibility?: string
  pressure?: string
  dewPoint?: string
  windDirectionDegrees?: number | null
  isDay?: boolean
  airQuality?: string
}

export interface WeatherDailyItem {
  date: string
  weatherText: string
  temperatureMax: string
  temperatureMin: string
  sunrise?: string
  sunset?: string
  dayWeatherText?: string
  nightWeatherText?: string
}

export interface WeatherCurrentResponse {
  code: number
  message: string
  data: WeatherCurrentData
}

export interface WeatherHourlyResponse {
  code: number
  message: string
  data: {
    cityId: string
    cityName: string
    source: string
    items: WeatherHourlyItem[]
  }
}

export interface WeatherDailyResponse {
  code: number
  message: string
  data: {
    cityId: string
    cityName: string
    source: string
    items: WeatherDailyItem[]
  }
}

export interface DailyWeatherDetailItem {
  date: string
  temperatureMax: string
  temperatureMin: string
  sunrise: string
  sunset: string
  dayWeatherText: string
  nightWeatherText: string
  dayMetrics: DayPeriodMetrics
  nightMetrics: DayPeriodMetrics
}

export interface DailyWeatherDetailResponse {
  code: number
  message: string
  data: {
    cityId: string
    cityName: string
    source: string
    items: DailyWeatherDetailItem[]
  }
}

export const getReverseGeocode = (lat: number, lng: number) => {
  return http.get<never, ReverseGeocodeResponse>('/weather/reverse-geocode', {
    params: {
      lat,
      lng,
    },
  })
}

export const getCurrentWeather = (cityId: string) => {
  return http.get<never, WeatherCurrentResponse>('/weather/current', {
    params: {
      cityId,
    },
  })
}

export const getHourlyWeather = (cityId: string) => {
  return http.get<never, WeatherHourlyResponse>('/weather/hourly', {
    params: {
      cityId,
    },
  })
}

export const getDailyWeather = (cityId: string) => {
  return http.get<never, WeatherDailyResponse>('/weather/daily', {
    params: {
      cityId,
    },
  })
}

export const getDailyWeatherDetail = (cityId: string) => {
  return http.get<never, DailyWeatherDetailResponse>('/weather/daily-detail', {
    params: {
      cityId,
    },
  })
}
