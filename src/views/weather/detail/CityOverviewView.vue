<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WeatherCityOverview from '@/components/weather/overview/WeatherCityOverview.vue'
import { weatherSearchSubmitKey, type WeatherSearchSubmitHandler } from '@/layout/helpers/weatherSearch'
import { useCityStore } from '@/store/city'

const route = useRoute()
const router = useRouter()
const cityStore = useCityStore()
const selectedCityName = ref('')
const weatherSearchSubmit = inject<WeatherSearchSubmitHandler | undefined>(weatherSearchSubmitKey, undefined)

const navItems = [
  { key: 'overview', label: '城市概览' },
  { key: 'temperature-trend', label: '温度趋势' },
  { key: 'weather-map', label: '天气地图' },
  { key: 'daily-weather', label: '单日天气' },
] as const

const routeCityName = computed(() => String(route.params.cityName ?? ''))
const selectedCity = computed(
  () => cityStore.cities.find((city) => city.cityName === selectedCityName.value)
    ?? cityStore.cities.find((city) => city.cityName === routeCityName.value)
    ?? null,
)
const activeNavKey = computed(() =>
  route.name === 'city-temperature-trend'
    ? 'temperature-trend'
    : route.name === 'city-weather-map'
      ? 'weather-map'
      : route.name === 'city-daily-weather'
        ? 'daily-weather'
      : 'overview',
)

const syncSelectedCity = () => {
  const currentName = selectedCityName.value.trim()
  const hasCurrentCity = cityStore.cities.some((city) => city.cityName === currentName)
  if (hasCurrentCity) {
    return
  }

  selectedCityName.value = routeCityName.value
}

watch(routeCityName, (nextCityName) => {
  selectedCityName.value = nextCityName
})
watch(() => cityStore.cities, syncSelectedCity, { deep: true, immediate: true })

onMounted(async () => {
  await cityStore.ensureCitiesLoaded()
  syncSelectedCity()
})

const handleCitySelect = (cityName: string) => {
  if (routeCityName.value === cityName && route.name === 'city-detail') {
    return
  }

  void router.push({
    name: 'city-detail',
    params: { cityName },
  })
}

const handleNavSelect = (navKey: string) => {
  if (!routeCityName.value) {
    return
  }

  if (navKey === 'temperature-trend') {
    if (route.name === 'city-temperature-trend') {
      return
    }

    void router.push({
      name: 'city-temperature-trend',
      params: { cityName: routeCityName.value },
    })
    return
  }

  if (navKey === 'overview') {
    if (route.name === 'city-detail') {
      return
    }

    void router.push({
      name: 'city-detail',
      params: { cityName: routeCityName.value },
    })
    return
  }

  if (navKey === 'weather-map') {
    if (route.name === 'city-weather-map') {
      return
    }

    void router.push({
      name: 'city-weather-map',
      params: { cityName: routeCityName.value },
    })
    return
  }

  if (navKey === 'daily-weather') {
    if (route.name === 'city-daily-weather') {
      return
    }

    void router.push({
      name: 'city-daily-weather',
      params: { cityName: routeCityName.value },
    })
  }
}

const handleSearchSubmit = (keyword: string) => {
  if (!weatherSearchSubmit) {
    return
  }

  void weatherSearchSubmit(keyword)
}
</script>

<template>
  <WeatherCityOverview
    v-if="selectedCity"
    :nav-items="navItems"
    :active-nav-key="activeNavKey"
    :cities="cityStore.cities"
    :default-city-name="cityStore.cities[0]?.cityName ?? ''"
    :selected-city-name="selectedCity.cityName"
    :temperature="selectedCity.temperature"
    :weather-text="selectedCity.weatherText"
    @city-select="handleCitySelect"
    @nav-select="handleNavSelect"
    @search-submit="handleSearchSubmit"
  />
</template>
