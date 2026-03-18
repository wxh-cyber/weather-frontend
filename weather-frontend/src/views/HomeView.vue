<script setup lang="ts">
import CurrentWeatherPanel from '@/components/weather/CurrentWeatherPanel.vue'
import HourlyForecastPanel from '@/components/weather/HourlyForecastPanel.vue'
import WeatherCityTabs from '@/components/weather/WeatherCityTabs.vue'
import WeatherMapPanel from '@/components/weather/WeatherMapPanel.vue'
import WeatherTopBar from '@/components/weather/WeatherTopBar.vue'

const menus = ['发现', '天气', '地图', '每小时预报', '月度天气', '天气趋势', '台风']
const cities = ['沙市区 11°', '双港东大街 10°', '南昌市 11°', '荆州市 11°']
</script>

<template>
  <main class="weather-page">
    <div class="container">
      <WeatherTopBar :menus="menus" />
      <WeatherCityTabs :cities="cities" />

      <section class="overview-grid">
        <CurrentWeatherPanel />
        <WeatherMapPanel />
      </section>

      <HourlyForecastPanel />
    </div>
  </main>
</template>

<style scoped>
.weather-page {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 0%, #1f4e9f 0%, #0a1e4e 44%, #081638 100%);
  padding: 30px 16px;
}

.container {
  width: min(1140px, 100%);
  margin: 0 auto;
  color: #f2f6ff;
}

.overview-grid {
  margin-top: 18px;
  display: grid;
  gap: 14px;
  grid-template-columns: 1.8fr 1fr;
}

@media (max-width: 940px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
