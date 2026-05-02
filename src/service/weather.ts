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

export const getDailyWeatherDetail = (cityId: string) => {
  return http.get<never, DailyWeatherDetailResponse>('/weather/daily-detail', {
    params: {
      cityId,
    },
  })
}
