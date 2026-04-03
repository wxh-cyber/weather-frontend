<script setup lang="ts">
import WeatherCityOverview from '@/components/weather/WeatherCityOverview.vue'

const menus = ['发现', '天气', '地图', '每小时预报', '月度天气', '天气趋势', '台风']
const cities = ['沙市区 11°', '双港东大街 10°', '南昌市 11°', '荆州市 11°']
</script>

<template>
  <main class="weather-page">
    <div class="cyber-grid-layer" />
    <div class="container">
      <WeatherCityOverview :menus="menus" :cities="cities" />
    </div>
  </main>
</template>

<style scoped>
.weather-page {
  position: relative;
  min-height: calc(100vh - var(--app-nav-height));
  background:
    radial-gradient(circle at 18% 10%, rgba(0, 255, 255, 0.18), transparent 38%),
    radial-gradient(circle at 85% 85%, rgba(255, 0, 153, 0.14), transparent 45%),
    linear-gradient(180deg, #051028 0%, #020816 100%);
  padding: 26px 16px 34px;
  color: var(--cyber-text);
}

.container {
  position: relative;
  z-index: 1;
  width: min(1140px, 100%);
  margin: 0 auto;
  color: var(--cyber-text);
}

@media (max-width: 640px) {
  .weather-page {
    min-height: calc(100vh - var(--app-nav-height-mobile));
    padding-top: 20px;
  }
}
</style>
