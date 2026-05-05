import { defineStore } from 'pinia'
import {
  createCity,
  deleteCity,
  deleteUserCities,
  deleteUserCity,
  getCityList,
  updateCity,
  type CityWeatherItem,
} from '@/service/city'
import { getStoredAuthUserId } from '@/store/auth'
import { isEquivalentCityName, resolveCanonicalCityName } from '@/utils/weather/cityNameDisplay'

export type CityItem = CityWeatherItem

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
const normalizeCityName = (cityName: string) => resolveCanonicalCityName(cityName)
const equalsCityName = (left: string, right: string) =>
  isEquivalentCityName(left, right)
const isLegacyDefaultCityList = (items: unknown): items is CityItem[] =>
  JSON.stringify(items) === JSON.stringify(legacyDefaultCities)
const isStoredCityItem = (item: unknown): item is CityItem =>
  typeof item === 'object'
  && item !== null
  && typeof (item as CityItem).cityName === 'string'
  && (item as CityItem).cityName.trim().length > 0
const hasCompleteWeatherBundle = (item: CityItem) =>
  Boolean(
    item.weather?.current
    && Array.isArray(item.weather.hourly?.items)
    && Array.isArray(item.weather.daily?.items)
    && Array.isArray(item.weather.dailyDetail?.items),
  )
const uniqueCityNames = (cityNames: string[]) => {
  const names: string[] = []
  for (const cityName of cityNames) {
    const normalizedName = normalizeCityName(cityName)
    if (!normalizedName) {
      continue
    }

    if (names.some((name) => equalsCityName(name, normalizedName))) {
      continue
    }

    names.push(normalizedName)
  }

  return names
}
const findCityByName = (cities: CityItem[], cityName: string) =>
  cities.find((city) => equalsCityName(city.cityName, cityName)) ?? null

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
      const normalizedKeyword = normalizeCityName(keyword)
      this.loading = true
      this.setError('')
      try {
        const response = await getCityList(normalizedKeyword)
        this.setCities(response.data)
      } catch (error) {
        const message = error instanceof Error ? error.message : '城市数据获取失败'
        this.setError(message)
      } finally {
        this.loading = false
      }
    },
    async ensureCitiesLoaded(options: { requireWeatherBundle?: boolean } = {}) {
      if (!getCurrentUserId()) {
        this.clearCities()
        return
      }

      const requiresWeatherRefresh = options.requireWeatherBundle === true
        && this.cities.some((city) => !hasCompleteWeatherBundle(city))

      if (this.cities.length > 0 && !this.hydratedFromStorage && !requiresWeatherRefresh) {
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
        
        if (!Array.isArray(response.data)) {
          this.setError('后端返回数据格式错误，请稍后重试')
          return false
        }

        const mergedList = this.mergeCreatedCityList(previousCities, response.data, normalizedName)
        
        const newCityFound = mergedList.some((item) => equalsCityName(item.cityName, normalizedName))
        if (!newCityFound) {
          this.setError('城市添加失败，请重试')
          return false
        }
        
        const stateConsistent = previousCities.length === this.cities.length
          && previousCities.every((prev, idx) => {
            const current = this.cities[idx]
            return current && equalsCityName(prev.cityName, current.cityName)
          })
        
        if (!stateConsistent) {
          await this.fetchCities('')
          return true
        }
        
        this.setCities(mergedList)
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
        let city = findCityByName(this.cities, normalizedName)
        if (!city?.cityId) {
          await this.fetchCities('')
          city = findCityByName(this.cities, normalizedName)
        }

        if (!city?.cityId) {
          this.setError('未找到待删除的城市')
          return false
        }

        const response = await deleteUserCity(city.cityId)
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
    async deleteCitiesByName(cityNames: string[]) {
      if (!getCurrentUserId()) {
        this.setError('请先登录后再删除城市')
        return {
          successCities: [] as string[],
          failedCities: uniqueCityNames(cityNames),
        }
      }

      const targets = uniqueCityNames(cityNames)
      const successCities: string[] = []
      const failedCities: string[] = []
      let lastErrorMessage = ''

      if (targets.length === 0) {
        return { successCities, failedCities }
      }

      this.loading = true
      this.setError('')
      try {
        let citySnapshot = [...this.cities]
        if (targets.some((cityName) => !findCityByName(citySnapshot, cityName)?.cityId)) {
          await this.fetchCities('')
          citySnapshot = [...this.cities]
        }

        const deletableCities: Array<{ cityName: string; cityId: string }> = []
        for (const cityName of targets) {
          const city = findCityByName(citySnapshot, cityName)
          if (!city?.cityId) {
            lastErrorMessage = '未找到待删除的城市'
            this.setError(lastErrorMessage)
            failedCities.push(cityName)
            continue
          }

          deletableCities.push({
            cityName,
            cityId: city.cityId,
          })
        }

        if (deletableCities.length > 0) {
          try {
            const response = await deleteUserCities(deletableCities.map((city) => city.cityId))
            const failedCityIds = new Set(response.failedCityIds ?? [])
            this.setCities(response.data)

            for (const city of deletableCities) {
              if (failedCityIds.has(city.cityId)) {
                failedCities.push(city.cityName)
              } else {
                successCities.push(city.cityName)
              }
            }

            if (failedCityIds.size > 0) {
              lastErrorMessage = '部分城市删除失败'
              this.setError(lastErrorMessage)
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : '删除城市失败'
            lastErrorMessage = message
            this.setError(message)
            failedCities.push(...deletableCities.map((city) => city.cityName))
          }
        }

        await this.fetchCities('')
        if (lastErrorMessage) {
          this.setError(lastErrorMessage)
        }
      } finally {
        this.loading = false
      }

      return { successCities, failedCities }
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
        if (previousCities.some((prev) => equalsCityName(prev.cityName, item.cityName))) {
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
