<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DailyWeatherPanel from '@/components/weather/overview/DailyWeatherPanel.vue'
import WeatherDetailHeader from '@/components/weather/shell/WeatherDetailHeader.vue'
import WeatherCityTabs from '@/components/weather/shell/WeatherCityTabs.vue'
import { weatherSearchSubmitKey, type WeatherSearchSubmitHandler } from '@/layout/helpers/weatherSearch'
import { useCityStore } from '@/store/city'

const route = useRoute()
const router = useRouter()
const cityStore = useCityStore()
const selectedCityName = ref('')
const searchKeyword = ref('')
const weatherSearchSubmit = inject<WeatherSearchSubmitHandler | undefined>(weatherSearchSubmitKey, undefined)

const navItems: ReadonlyArray<{
  key: string
  label: string
  disabled?: boolean
}> = [
  { key: 'overview', label: '城市概览' },
  { key: 'temperature-trend', label: '温度趋势' },
  { key: 'weather-map', label: '天气地图' },
  { key: 'daily-weather', label: '单日天气' },
]

const routeCityName = computed(() => String(route.params.cityName ?? ''))
const selectedCity = computed(
  () => cityStore.cities.find((city) => city.cityName === selectedCityName.value)
    ?? cityStore.cities.find((city) => city.cityName === routeCityName.value)
    ?? null,
)

const syncSelectedCity = () => {
  const currentName = selectedCityName.value.trim()
  const hasCurrentCity = cityStore.cities.some((city) => city.cityName === currentName)
  if (hasCurrentCity) {
    return
  }

  selectedCityName.value = routeCityName.value
}

const submitSearch = (keyword: string) => {
  if (!weatherSearchSubmit) {
    return
  }

  searchKeyword.value = keyword.trim()
  void weatherSearchSubmit(searchKeyword.value)
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
  if (routeCityName.value === cityName && route.name === 'city-daily-weather') {
    return
  }

  void router.push({
    name: 'city-daily-weather',
    params: { cityName },
  })
}

const handleNavSelect = (navKey: string) => {
  if (!routeCityName.value) {
    return
  }

  if (navKey === 'overview') {
    void router.push({
      name: 'city-detail',
      params: { cityName: routeCityName.value },
    })
    return
  }

  if (navKey === 'temperature-trend') {
    void router.push({
      name: 'city-temperature-trend',
      params: { cityName: routeCityName.value },
    })
    return
  }

  if (navKey === 'weather-map') {
    void router.push({
      name: 'city-weather-map',
      params: { cityName: routeCityName.value },
    })
  }
}
</script>

<template>
  <section v-if="selectedCity" class="daily-weather-view">
    <WeatherDetailHeader
      :nav-items="navItems"
      active-nav-key="daily-weather"
      :initial-search-keyword="searchKeyword"
      @nav-select="handleNavSelect"
      @search-submit="submitSearch"
    />

    <WeatherCityTabs
      :cities="cityStore.cities"
      :default-city-name="cityStore.cities[0]?.cityName ?? ''"
      :selected-city-name="selectedCity.cityName"
      @select="handleCitySelect"
    />

    <DailyWeatherPanel :city="selectedCity" />
  </section>
</template>

<style scoped>
.daily-weather-view {
  display: grid;
  gap: 14px;
  min-width: 0;
}
</style>
