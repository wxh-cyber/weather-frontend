import { defineStore } from 'pinia'
import { createCity, deleteCity, getCityList, updateCity } from '@/service/city'
import { getStoredAuthUserId } from '@/store/auth'

export interface CityItem {
  cityId?: string
  cityName: string
  cityCode?: string | null
  province?: string
  country?: string
  latitude?: number | null
  longitude?: number | null
  weatherText: string
  temperature: string
}

const LEGACY_CITY_LIST_KEY = 'city_list'
const CITY_LIST_KEY_PREFIX = 'city_list:user:'

const legacyDefaultCities: CityItem[] = [
  { cityName: '沙市区', weatherText: '多云', temperature: '11°C' },
  { cityName: '双港东大街', weatherText: '小雨', temperature: '10°C' },
  { cityName: '南昌市', weatherText: '阴天', temperature: '12°C' },
  { cityName: '荆州市', weatherText: '晴', temperature: '13°C' },
  { cityName: '武汉市', weatherText: '阵雨', temperature: '14°C' },
]

const isBrowser = () => typeof window !== 'undefined'
const getCurrentUserId = () => getStoredAuthUserId()
const normalizeCityName = (cityName: string) => cityName.trim()
const equalsCityName = (left: string, right: string) =>
  left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase()
const isLegacyDefaultCityList = (items: unknown): items is CityItem[] =>
  JSON.stringify(items) === JSON.stringify(legacyDefaultCities)
const isStoredCityItem = (item: unknown): item is CityItem =>
  typeof item === 'object'
  && item !== null
  && typeof (item as CityItem).cityName === 'string'
  && (item as CityItem).cityName.trim().length > 0

export const buildCityListStorageKey = (userId: string) => `${CITY_LIST_KEY_PREFIX}${userId}`

export const clearLegacyCityListStorage = () => {
  if (!isBrowser()) {
    return
  }

  localStorage.removeItem(LEGACY_CITY_LIST_KEY)
}

export const clearPersistedCitiesForUserId = (userId: string) => {
  if (!isBrowser() || !userId.trim()) {
    return
  }

  localStorage.removeItem(buildCityListStorageKey(userId))
}

const readStoredCitiesForUser = (userId: string) => {
  if (!isBrowser() || !userId.trim()) {
    return null
  }

  return localStorage.getItem(buildCityListStorageKey(userId))
}

export const useCityStore = defineStore('city', {
  state: () => ({
    cities: [] as CityItem[],
    loading: false,
    error: '',
    hydratedFromStorage: false,
  }),
  getters: {
    hasCities: (state) => state.cities.length > 0,
  },
  actions: {
    setCities(items: CityItem[]) {
      this.cities = [...items]
      this.hydratedFromStorage = false
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
    clearCities() {
      this.cities = []
      this.error = ''
      this.loading = false
      this.hydratedFromStorage = false
    },
    clearPersistedCitiesForUser(userId: string) {
      clearPersistedCitiesForUserId(userId)
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
      if (!getCurrentUserId()) {
        this.clearCities()
        return
      }

      if (this.cities.length > 0 && !this.hydratedFromStorage) {
        return
      }
      await this.fetchCities('')
    },
    async createCityByName(cityName: string) {
      if (!getCurrentUserId()) {
        this.setError('请先登录后再添加城市')
        return false
      }

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
        const previousCities = [...this.cities]
        const response = await createCity(normalizedName)
        this.setCities(this.mergeCreatedCityList(previousCities, response.data, normalizedName))
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
      if (!getCurrentUserId()) {
        this.setError('请先登录后再修改城市')
        return false
      }

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
      if (!getCurrentUserId()) {
        this.setError('请先登录后再设置默认城市')
        return false
      }

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
      if (!getCurrentUserId()) {
        this.setError('请先登录后再删除城市')
        return false
      }

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
      const userId = getCurrentUserId()
      if (!userId) {
        return
      }

      localStorage.setItem(buildCityListStorageKey(userId), JSON.stringify(this.cities))
    },
    syncFromStorage() {
      clearLegacyCityListStorage()

      const userId = getCurrentUserId()
      if (!userId) {
        this.clearCities()
        return
      }

      if (!isBrowser()) {
        this.clearCities()
        return
      }

      const raw = readStoredCitiesForUser(userId)
      if (!raw) {
        this.clearCities()
        return
      }

      try {
        const parsed = JSON.parse(raw) as unknown
        if (!Array.isArray(parsed) || isLegacyDefaultCityList(parsed) || !parsed.every(isStoredCityItem)) {
          this.clearCities()
          this.persistCities()
          return
        }
        this.cities = [...parsed]
        this.error = ''
        this.loading = false
        this.hydratedFromStorage = true
      } catch {
        this.clearCities()
        this.persistCities()
      }
    },
    mergeCreatedCityList(previousCities: CityItem[], nextCities: CityItem[], createdCityName: string) {
      if (previousCities.length === 0) {
        return [...nextCities]
      }

      const previousNames = new Set(previousCities.map((item) => item.cityName))
      const mergedCities: CityItem[] = []

      for (const item of previousCities) {
        const latestItem = nextCities.find((candidate) => equalsCityName(candidate.cityName, item.cityName))
        mergedCities.push(latestItem ?? item)
      }

      const createdCity = nextCities.find((item) => equalsCityName(item.cityName, createdCityName))
      if (createdCity && !mergedCities.some((item) => equalsCityName(item.cityName, createdCity.cityName))) {
        mergedCities.push(createdCity)
      }

      for (const item of nextCities) {
        if (previousNames.has(item.cityName)) {
          continue
        }

        if (mergedCities.some((candidate) => equalsCityName(candidate.cityName, item.cityName))) {
          continue
        }

        mergedCities.push(item)
      }

      return mergedCities
    },
  },
})
