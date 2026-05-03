<script setup lang="ts">
import { inject } from 'vue'
import WeatherCityOverview from '@/components/weather/overview/WeatherCityOverview.vue'
import { useWeatherDetailPage, weatherDetailNavItems } from '@/composables/useWeatherDetailPage'
import { weatherSearchSubmitKey, type WeatherSearchSubmitHandler } from '@/layout/helpers/weatherSearch'
const weatherSearchSubmit = inject<WeatherSearchSubmitHandler | undefined>(weatherSearchSubmitKey, undefined)
const {
  cityStore,
  selectedCity,
  activeNavKey,
  handleCitySelect,
  handleNavSelect,
  submitSearch,
} = useWeatherDetailPage({
  activeRouteName: 'city-detail',
  citySelectRouteName: 'city-detail',
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
  <WeatherCityOverview
    v-if="selectedCity"
    :nav-items="weatherDetailNavItems"
    :active-nav-key="activeNavKey"
    :cities="cityStore.cities"
    :default-city-name="cityStore.cities[0]?.cityName ?? ''"
    :selected-city-name="selectedCity.cityName"
    :temperature="selectedCity.temperature"
    :weather-text="selectedCity.weatherText"
    @city-select="handleCitySelect"
    @nav-select="handleNavSelect"
    @search-submit="submitSearch"
  />
</template>
