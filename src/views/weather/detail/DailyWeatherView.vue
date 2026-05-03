<script setup lang="ts">
import { inject } from 'vue'
import DailyWeatherPanel from '@/components/weather/overview/DailyWeatherPanel.vue'
import { useWeatherDetailPage, weatherDetailNavItems } from '@/composables/useWeatherDetailPage'
import WeatherDetailHeader from '@/components/weather/shell/WeatherDetailHeader.vue'
import WeatherCityTabs from '@/components/weather/shell/WeatherCityTabs.vue'
import { weatherSearchSubmitKey, type WeatherSearchSubmitHandler } from '@/layout/helpers/weatherSearch'
const weatherSearchSubmit = inject<WeatherSearchSubmitHandler | undefined>(weatherSearchSubmitKey, undefined)
const {
  cityStore,
  selectedCity,
  searchKeyword,
  activeNavKey,
  handleCitySelect,
  handleNavSelect,
  submitSearch,
} = useWeatherDetailPage({
  activeRouteName: 'city-daily-weather',
  citySelectRouteName: 'city-daily-weather',
  navRouteMap: {
    overview: 'city-detail',
    'temperature-trend': 'city-temperature-trend',
    'weather-map': 'city-weather-map',
    'daily-weather': 'city-daily-weather',
  },
  weatherSearchSubmit,
})
</script>

<template>
  <section v-if="selectedCity" class="daily-weather-view">
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
