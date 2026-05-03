<script setup lang="ts">
import { inject } from 'vue'
import WeatherCityTabs from '@/components/weather/shell/WeatherCityTabs.vue'
import WeatherMapExplorer from '@/components/weather/map/WeatherMapExplorer.vue'
import { useWeatherDetailPage, weatherDetailNavItems } from '@/composables/useWeatherDetailPage'
import WeatherDetailHeader from '@/components/weather/shell/WeatherDetailHeader.vue'
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
  activeRouteName: 'city-weather-map',
  citySelectRouteName: 'city-weather-map',
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
  <section v-if="selectedCity" class="map-view">
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

    <WeatherMapExplorer
      :city-name="selectedCity.cityName"
      :weather-text="selectedCity.weatherText"
      :province="selectedCity.province"
      :country="selectedCity.country"
      :latitude="selectedCity.latitude"
      :longitude="selectedCity.longitude"
    />
  </section>
</template>

<style scoped>
.map-view {
  display: grid;
  gap: 14px;
  min-width: 0;
}
</style>
