import { defineStore } from 'pinia'
import { getCityList } from '@/service/city'

export interface CityItem {
  cityName: string
  weatherText: string
  temperature: string
}

const CITY_LIST_KEY = 'city_list'

const defaultCities: CityItem[] = [
  { cityName: '沙市区', weatherText: '多云', temperature: '11°C' },
  { cityName: '双港东大街', weatherText: '小雨', temperature: '10°C' },
  { cityName: '南昌市', weatherText: '阴天', temperature: '12°C' },
  { cityName: '荆州市', weatherText: '晴', temperature: '13°C' },
  { cityName: '武汉市', weatherText: '阵雨', temperature: '14°C' },
]

const isBrowser = () => typeof window !== 'undefined'

export const useCityStore = defineStore('city', {
  state: () => ({
    cities: [] as CityItem[],
    loading: false,
    error: '',
  }),
  getters: {
    hasCities: (state) => state.cities.length > 0,
  },
  actions: {
    setCities(items: CityItem[]) {
      this.cities = [...items]
      this.persistCities()
    },
    addCity(item: CityItem) {
      this.cities.push(item)
      this.persistCities()
    },
    setError(message: string) {
      this.error = message
    },
    removeCity(cityName: string) {
      this.cities = this.cities.filter((city) => city.cityName !== cityName)
      this.persistCities()
    },
    async fetchCities(keyword = '') {
      this.loading = true
      this.setError('')
      try {
        const response = await getCityList(keyword)
        this.setCities(response.data)
      } catch (error) {
        const message = error instanceof Error ? error.message : '城市数据获取失败'
        this.setError(message)
      } finally {
        this.loading = false
      }
    },
    persistCities() {
      if (!isBrowser()) return
      localStorage.setItem(CITY_LIST_KEY, JSON.stringify(this.cities))
    },
    syncFromStorage() {
      if (!isBrowser()) {
        this.cities = [...defaultCities]
        return
      }

      const raw = localStorage.getItem(CITY_LIST_KEY)
      if (!raw) {
        this.cities = [...defaultCities]
        this.persistCities()
        return
      }

      try {
        const parsed = JSON.parse(raw) as CityItem[]
        this.cities = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...defaultCities]
      } catch {
        this.cities = [...defaultCities]
      }
      this.persistCities()
    },
  },
})
