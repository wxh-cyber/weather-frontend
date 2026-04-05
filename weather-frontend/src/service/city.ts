import http from './http'

export interface CityWeatherItem {
  cityName: string
  weatherText: string
  temperature: string
}

export interface CityListResponse {
  code: number
  message: string
  data: CityWeatherItem[]
}

export const getCityList = (keyword = '') => {
  return http.get<never, CityListResponse>('/cities', {
    params: {
      keyword,
    },
  })
}
