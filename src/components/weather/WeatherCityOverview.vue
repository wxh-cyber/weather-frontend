<script setup lang="ts">
import CurrentWeatherPanel from '@/components/weather/CurrentWeatherPanel.vue'
import HourlyForecastPanel from '@/components/weather/HourlyForecastPanel.vue'
import WeatherCityTabs from '@/components/weather/WeatherCityTabs.vue'
import WeatherMapPanel from '@/components/weather/WeatherMapPanel.vue'
import type { CityItem } from '@/store/city'

const props = defineProps<{
  menus: string[]
  cities: CityItem[]
  defaultCityName: string
  selectedCityName: string
  temperature?: string
  weatherText?: string
}>()

const emit = defineEmits<{
  (e: 'city-select', cityName: string): void
}>()
</script>

<template>
  <section class="city-overview">
    <header class="dashboard-head">
      <nav class="menu">
        <a v-for="item in menus" :key="item" href="#">{{ item }}</a>
      </nav>
    </header>

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
      <WeatherMapPanel :city-name="props.selectedCityName" :weather-text="props.weatherText" />
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

.dashboard-head {
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background: linear-gradient(140deg, rgba(7, 24, 56, 0.8), rgba(4, 16, 38, 0.72));
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.12),
    var(--cyber-glow-md);
  backdrop-filter: blur(6px);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
}

.menu {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.menu a {
  color: var(--cyber-text-muted);
  text-decoration: none;
  transition: color var(--cyber-ease), text-shadow var(--cyber-ease);
}

.menu a:hover {
  color: var(--cyber-cyan);
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.5);
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-head {
    animation: none;
  }
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
