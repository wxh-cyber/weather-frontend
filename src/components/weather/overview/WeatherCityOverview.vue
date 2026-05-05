<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CurrentWeatherPanel from '@/components/weather/overview/CurrentWeatherPanel.vue'
import HourlyForecastPanel from '@/components/weather/overview/HourlyForecastPanel.vue'
import WeatherCityTabs from '@/components/weather/shell/WeatherCityTabs.vue'
import WeatherMapPanel from '@/components/weather/map/WeatherMapPanel.vue'
import WeatherDetailHeader from '@/components/weather/shell/WeatherDetailHeader.vue'
import {
  getCurrentWeather,
  getDailyWeather,
  getHourlyWeather,
  type WeatherCurrentData,
  type WeatherDailyItem,
  type WeatherHourlyItem,
} from '@/service/weather'
import type { CityItem } from '@/store/city'
import { resolveDisplayCityName } from '@/utils/weather/cityNameDisplay'

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

const selectedCityMeta = computed(() => {
  const matchedCities = props.cities.filter((city) => city.cityName === props.selectedCityName)
  if (!matchedCities.length) {
    return null
  }

  return matchedCities.find((city) => city.cityId) ?? matchedCities[0] ?? null
})
const displaySelectedCityName = computed(() => resolveDisplayCityName(props.selectedCityName))
const currentWeather = ref<WeatherCurrentData | null>(null)
const hourlyItems = ref<WeatherHourlyItem[]>([])
const dailyItems = ref<WeatherDailyItem[]>([])

const applyBundledWeather = () => {
  const bundledWeather = selectedCityMeta.value?.weather
  currentWeather.value = bundledWeather?.current ?? null
  hourlyItems.value = bundledWeather?.hourly.items ?? []
  dailyItems.value = bundledWeather?.daily.items ?? []
}

watch(
  () => ({
    cityId: selectedCityMeta.value?.cityId,
    weather: selectedCityMeta.value?.weather,
  }),
  async ({ cityId }) => {
    applyBundledWeather()

    if (!cityId) {
      return
    }

    try {
      const currentResponse = await getCurrentWeather(cityId)
      currentWeather.value = currentResponse.data
    } catch {
      currentWeather.value = selectedCityMeta.value?.weather?.current ?? currentWeather.value
    }

    try {
      const hourlyResponse = await getHourlyWeather(cityId)
      hourlyItems.value = hourlyResponse.data.items
    } catch {
      hourlyItems.value = selectedCityMeta.value?.weather?.hourly.items ?? hourlyItems.value
    }

    try {
      const dailyResponse = await getDailyWeather(cityId)
      dailyItems.value = dailyResponse.data.items
    } catch {
      dailyItems.value = selectedCityMeta.value?.weather?.daily.items ?? dailyItems.value
    }
  },
  { immediate: true },
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
        :city-name="displaySelectedCityName"
        :temperature="currentWeather?.temperature ?? props.temperature"
        :weather-text="currentWeather?.weatherText ?? props.weatherText"
        :current-weather="currentWeather"
      />
      <WeatherMapPanel
        :city-name="displaySelectedCityName"
        :weather-text="currentWeather?.weatherText ?? props.weatherText"
        :province="selectedCityMeta?.province"
        :country="selectedCityMeta?.country"
        :latitude="selectedCityMeta?.latitude"
        :longitude="selectedCityMeta?.longitude"
      />
    </section>

    <HourlyForecastPanel
      :city-name="displaySelectedCityName"
      :temperature="currentWeather?.temperature ?? props.temperature"
      :weather-text="currentWeather?.weatherText ?? props.weatherText"
      :hourly-items="hourlyItems"
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
  grid-template-columns: minmax(0, 1.64fr) minmax(320px, 0.96fr);
  align-items: stretch;
  min-width: 0;
}

@media (max-width: 940px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
