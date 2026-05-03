import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCityStore } from '@/store/city'
import type { WeatherSearchSubmitHandler } from '@/layout/helpers/weatherSearch'
import { isEquivalentCityName } from '@/utils/weather/cityNameDisplay'

type WeatherDetailNavKey =
  | 'overview'
  | 'temperature-trend'
  | 'weather-map'
  | 'daily-weather'

type NavRouteMap = Record<WeatherDetailNavKey, string>

export const weatherDetailNavItems = [
  { key: 'overview', label: '城市概览' },
  { key: 'temperature-trend', label: '温度趋势' },
  { key: 'weather-map', label: '天气地图' },
  { key: 'daily-weather', label: '单日天气' },
] as const

export const useWeatherDetailPage = (options: {
  activeRouteName: string
  citySelectRouteName: string
  navRouteMap: NavRouteMap
  weatherSearchSubmit?: WeatherSearchSubmitHandler
}) => {
  const route = useRoute()
  const router = useRouter()
  const cityStore = useCityStore()
  const selectedCityName = ref('')
  const searchKeyword = ref('')

  const routeCityName = computed(() => String(route.params.cityName ?? ''))
  const selectedCity = computed(
    () => cityStore.cities.find((city) => isEquivalentCityName(city.cityName, selectedCityName.value))
      ?? cityStore.cities.find((city) => isEquivalentCityName(city.cityName, routeCityName.value))
      ?? null,
  )

  const activeNavKey = computed<WeatherDetailNavKey>(() => {
    const matchedEntry = Object.entries(options.navRouteMap).find(([, routeName]) => route.name === routeName)
    return (matchedEntry?.[0] as WeatherDetailNavKey | undefined) ?? 'overview'
  })

  const syncSelectedCity = () => {
    const currentName = selectedCityName.value.trim()
    const hasCurrentCity = cityStore.cities.some((city) => isEquivalentCityName(city.cityName, currentName))
    if (hasCurrentCity) {
      return
    }

    selectedCityName.value = routeCityName.value
  }

  const submitSearch = (keyword: string) => {
    if (!options.weatherSearchSubmit) {
      return
    }

    searchKeyword.value = keyword.trim()
    void options.weatherSearchSubmit(searchKeyword.value)
  }

  const handleCitySelect = (cityName: string) => {
    if (isEquivalentCityName(routeCityName.value, cityName) && route.name === options.citySelectRouteName) {
      return
    }

    void router.push({
      name: options.citySelectRouteName,
      params: { cityName },
    })
  }

  const handleNavSelect = (navKey: string) => {
    if (!routeCityName.value) {
      return
    }

    if (!Object.prototype.hasOwnProperty.call(options.navRouteMap, navKey)) {
      return
    }

    const typedNavKey = navKey as WeatherDetailNavKey
    const targetRouteName = options.navRouteMap[typedNavKey]
    if (route.name === targetRouteName) {
      return
    }

    void router.push({
      name: targetRouteName,
      params: { cityName: routeCityName.value },
    })
  }

  watch(routeCityName, (nextCityName) => {
    selectedCityName.value = nextCityName
  })
  watch(() => cityStore.cities, syncSelectedCity, { deep: true, immediate: true })

  onMounted(async () => {
    await cityStore.ensureCitiesLoaded()
    syncSelectedCity()
  })

  return {
    cityStore,
    routeCityName,
    selectedCity,
    selectedCityName,
    searchKeyword,
    activeNavKey,
    handleCitySelect,
    handleNavSelect,
    submitSearch,
  }
}
