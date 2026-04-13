import { defineStore } from 'pinia'
import { createCity, deleteCity, getCityList, updateCity } from '@/service/city'

export interface CityItem {
  cityName: string
  weatherText: string
  temperature: string
}

const CITY_LIST_KEY = 'city_list'

const legacyDefaultCities: CityItem[] = [
  { cityName: '沙市区', weatherText: '多云', temperature: '11°C' },
  { cityName: '双港东大街', weatherText: '小雨', temperature: '10°C' },
  { cityName: '南昌市', weatherText: '阴天', temperature: '12°C' },
  { cityName: '荆州市', weatherText: '晴', temperature: '13°C' },
  { cityName: '武汉市', weatherText: '阵雨', temperature: '14°C' },
]

const isBrowser = () => typeof window !== 'undefined'
const normalizeCityName = (cityName: string) => cityName.trim()
const equalsCityName = (left: string, right: string) =>
  left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase()
const isLegacyDefaultCityList = (items: unknown): items is CityItem[] =>
  JSON.stringify(items) === JSON.stringify(legacyDefaultCities)

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
    async ensureCitiesLoaded() {
      if (this.cities.length > 0) {
        return
      }
      await this.fetchCities('')
    },
    async createCityByName(cityName: string) {
      const normalizedName = normalizeCityName(cityName)
      if (!normalizedName) {
        this.setError('城市名称不能为空')
        return false
      }

      this.setError('')
      if (this.cities.some((item) => equalsCityName(item.cityName, normalizedName))) {
        this.setError('城市已存在，请勿重复添加')
        return false
      }

      this.loading = true
      try {
        const response = await createCity(normalizedName)
        this.setCities(response.data)
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '新增城市失败'
        this.setError(message)
        return false
      } finally {
        this.loading = false
      }
    },
    async renameCity(oldCityName: string, newCityName: string) {
      const sourceName = normalizeCityName(oldCityName)
      const targetName = normalizeCityName(newCityName)

      if (!sourceName || !targetName) {
        this.setError('城市名称不能为空')
        return false
      }

      this.setError('')
      let sourceExists = this.cities.some((item) => equalsCityName(item.cityName, sourceName))
      if (!sourceExists) {
        await this.fetchCities('')
        sourceExists = this.cities.some((item) => equalsCityName(item.cityName, sourceName))
      }

      if (!sourceExists) {
        this.setError('未找到待修改的城市')
        return false
      }

      const duplicateTarget = this.cities.some(
        (item) => equalsCityName(item.cityName, targetName) && !equalsCityName(item.cityName, sourceName),
      )
      if (duplicateTarget) {
        this.setError('目标城市名称已存在')
        return false
      }

      if (equalsCityName(sourceName, targetName)) {
        return true
      }

      this.loading = true
      try {
        const response = await updateCity(sourceName, targetName)
        this.setCities(response.data)
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '修改城市失败'
        this.setError(message)
        return false
      } finally {
        this.loading = false
      }
    },
    async setDefaultCityByName(cityName: string) {
      const normalizedName = normalizeCityName(cityName)
      if (!normalizedName) {
        this.setError('默认城市不能为空')
        return false
      }

      this.setError('')
      let currentCities = [...this.cities]
      let targetIndex = currentCities.findIndex((item) => equalsCityName(item.cityName, normalizedName))

      if (targetIndex < 0) {
        await this.fetchCities('')
        currentCities = [...this.cities]
        targetIndex = currentCities.findIndex((item) => equalsCityName(item.cityName, normalizedName))
      }

      if (targetIndex < 0) {
        this.setError('未找到该城市，请检查名称后重试')
        return false
      }

      if (targetIndex === 0) {
        return true
      }

      const [targetCity] = currentCities.splice(targetIndex, 1)
      if (!targetCity) {
        this.setError('默认城市更新失败')
        return false
      }
      this.setCities([targetCity, ...currentCities])
      return true
    },
    async deleteCityByName(cityName: string) {
      const normalizedName = normalizeCityName(cityName)
      if (!normalizedName) {
        this.setError('城市名称不能为空')
        return false
      }

      this.setError('')
      this.loading = true
      try {
        const response = await deleteCity(normalizedName)
        this.setCities(response.data)
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '删除城市失败'
        this.setError(message)
        return false
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
        this.cities = []
        return
      }

      const raw = localStorage.getItem(CITY_LIST_KEY)
      if (!raw) {
        this.cities = []
        return
      }

      try {
        const parsed = JSON.parse(raw) as CityItem[]
        if (!Array.isArray(parsed) || isLegacyDefaultCityList(parsed)) {
          this.cities = []
          this.persistCities()
          return
        }
        this.cities = [...parsed]
      } catch {
        this.cities = []
      }
    },
  },
})
