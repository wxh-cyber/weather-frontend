import http from './http'
import type {
  DailyWeatherDetailResponse,
  WeatherCurrentData,
  WeatherDailyResponse,
  WeatherHourlyResponse,
} from './weather'

export interface CityWeatherBundle {
  current: WeatherCurrentData
  hourly: WeatherHourlyResponse['data']
  daily: WeatherDailyResponse['data']
  dailyDetail: DailyWeatherDetailResponse['data']
}

export interface CityWeatherItem {
  cityId?: string
  cityName: string
  cityCode?: string | null
  province?: string
  country?: string
  latitude?: number | null
  longitude?: number | null
  isDefault?: boolean
  sortOrder?: number
  weatherText: string
  temperature: string
  weather?: CityWeatherBundle
}

export interface CityListResponse {
  code: number
  message: string
  data: CityWeatherItem[]
}

export interface CityBatchDeleteResponse extends CityListResponse {
  failedCityIds?: string[]
}

export const getCityList = (keyword = '') => {
  return http.get<never, CityListResponse>('/cities', {
    params: {
      keyword,
    },
  })
}

export const createCity = (cityName: string) => {
  return http.post<{ cityName: string }, CityListResponse>('/cities', {
    cityName,
  })
}

export const updateCity = (oldCityName: string, cityName: string) => {
  return http.put<{ cityName: string }, CityListResponse>(`/cities/${encodeURIComponent(oldCityName)}`, {
    cityName,
  })
}

export const deleteCity = (cityName: string) => {
  return http.delete<never, CityListResponse>(`/cities/${encodeURIComponent(cityName)}`)
}

export const deleteUserCity = (cityId: string) => {
  return http.delete<never, CityListResponse>(`/user/cities/${encodeURIComponent(cityId)}`)
}

export const deleteUserCities = (cityIds: string[]) => {
  return http.post<{ cityIds: string[] }, CityBatchDeleteResponse>('/user/cities/batch-delete', {
    cityIds,
  })
}
