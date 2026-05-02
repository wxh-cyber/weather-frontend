<script setup lang="ts">
import { computed } from 'vue'
import CurrentWeatherPanel from '@/components/weather/overview/CurrentWeatherPanel.vue'
import HourlyForecastPanel from '@/components/weather/overview/HourlyForecastPanel.vue'
import WeatherCityTabs from '@/components/weather/shell/WeatherCityTabs.vue'
import WeatherMapPanel from '@/components/weather/map/WeatherMapPanel.vue'
import WeatherDetailHeader from '@/components/weather/shell/WeatherDetailHeader.vue'
import type { CityItem } from '@/store/city'

const props = defineProps<{
  navItems: ReadonlyArray<{
    key: string
    label: string
    disabled?: boolean
  }>
  activeNavKey: string
  cities: CityItem[]
  defaultCityName: string
  selectedCityName: string
  temperature?: string
  weatherText?: string
}>()

const emit = defineEmits<{
  (e: 'city-select', cityName: string): void
  (e: 'nav-select', navKey: string): void
  (e: 'search-submit', keyword: string): void
}>()

const selectedCityMeta = computed(
  () => props.cities.find((city) => city.cityName === props.selectedCityName) ?? null,
)
</script>

<template>
  <section class="city-overview">
    <WeatherDetailHeader
      :nav-items="props.navItems"
      :active-nav-key="props.activeNavKey"
      @nav-select="emit('nav-select', $event)"
      @search-submit="emit('search-submit', $event)"
    />

    <WeatherCityTabs
      :cities="props.cities"
      :default-city-name="props.defaultCityName"
      :selected-city-name="props.selectedCityName"
      @select="emit('city-select', $event)"
    />

    <section class="overview-grid">
      <CurrentWeatherPanel
        :city-name="props.selectedCityName"
        :temperature="props.temperature"
        :weather-text="props.weatherText"
      />
      <WeatherMapPanel
        :city-name="props.selectedCityName"
        :weather-text="props.weatherText"
        :province="selectedCityMeta?.province"
        :country="selectedCityMeta?.country"
        :latitude="selectedCityMeta?.latitude"
        :longitude="selectedCityMeta?.longitude"
      />
    </section>

    <HourlyForecastPanel
      :city-name="props.selectedCityName"
      :temperature="props.temperature"
      :weather-text="props.weatherText"
    />
  </section>
</template>

<style scoped>
.city-overview {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.overview-grid {
  margin-top: 4px;
  display: grid;
  gap: 14px;
  grid-template-columns: 1.8fr 1fr;
  min-width: 0;
}

@media (max-width: 940px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
