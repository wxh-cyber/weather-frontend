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
