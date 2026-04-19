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

export const getReverseGeocode = (lat: number, lng: number) => {
  return http.get<never, ReverseGeocodeResponse>('/weather/reverse-geocode', {
    params: {
      lat,
      lng,
    },
  })
}
