<script setup lang="ts">
import { inject, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import WeeklyTemperatureTrendPanel from '@/components/weather/overview/WeeklyTemperatureTrendPanel.vue'
import { useWeatherDetailPage, weatherDetailNavItems } from '@/composables/useWeatherDetailPage'
import WeatherDetailHeader from '@/components/weather/shell/WeatherDetailHeader.vue'
import WeatherCityTabs from '@/components/weather/shell/WeatherCityTabs.vue'
import { getDailyWeather, type WeatherDailyItem } from '@/service/weather'
import { weatherSearchSubmitKey, type WeatherSearchSubmitHandler } from '@/layout/helpers/weatherSearch'
const weatherSearchSubmit = inject<WeatherSearchSubmitHandler | undefined>(weatherSearchSubmitKey, undefined)
const router = useRouter()
const dailyItems = ref<WeatherDailyItem[]>([])
const {
  cityStore,
  selectedCity,
  searchKeyword,
  activeNavKey,
  handleCitySelect,
  handleNavSelect,
  submitSearch,
} = useWeatherDetailPage({
  activeRouteName: 'city-temperature-trend',
  citySelectRouteName: 'city-temperature-trend',
  navRouteMap: {
    overview: 'city-detail',
    'temperature-trend': 'city-temperature-trend',
    'weather-map': 'city-weather-map',
    'daily-weather': 'city-daily-weather',
  },
  weatherSearchSubmit,
})

const handleTrendDateSelect = (date: string) => {
  if (!selectedCity.value?.cityName) {
    return
  }

  void router.push({
    name: 'city-daily-weather',
    params: { cityName: selectedCity.value.cityName },
    query: { date },
  })
}

const applyBundledDailyItems = () => {
  dailyItems.value = selectedCity.value?.weather?.daily.items ?? []
}

watch(
  () => ({
    cityId: selectedCity.value?.cityId,
    dailyItems: selectedCity.value?.weather?.daily.items,
  }),
  async ({ cityId }) => {
    applyBundledDailyItems()
    if (!cityId) {
      return
    }

    try {
      const response = await getDailyWeather(cityId)
      dailyItems.value = response.data.items
    } catch {
      applyBundledDailyItems()
    }
  },
  { immediate: true },
)
</script>

<template>
  <section v-if="selectedCity" class="trend-view">
    <WeatherDetailHeader
      :nav-items="weatherDetailNavItems"
      :active-nav-key="activeNavKey"
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

    <WeeklyTemperatureTrendPanel
      :city-name="selectedCity.cityName"
      :temperature="selectedCity.temperature"
      :daily-items="dailyItems"
      @date-select="handleTrendDateSelect"
    />
  </section>
</template>

<style scoped>
.trend-view {
  display: grid;
  gap: 14px;
  min-width: 0;
}
</style>
