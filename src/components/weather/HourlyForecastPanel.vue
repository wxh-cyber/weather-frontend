<script setup lang="ts">
import { getWeatherIcon, type WeatherIconKey } from '@/components/weather/weatherIconMap'

const forecasts = [
  { day: '昨天', high: '19°', low: '11°', iconKey: 'rainy' as WeatherIconKey },
  { day: '今天', high: '11°', low: '9°', iconKey: 'night-cloudy' as WeatherIconKey },
  { day: '周四', high: '14°', low: '11°', iconKey: 'partly-cloudy' as WeatherIconKey },
  { day: '周五', high: '13°', low: '10°', iconKey: 'rainy' as WeatherIconKey },
  { day: '周六', high: '17°', low: '12°', iconKey: 'sunny' as WeatherIconKey },
  { day: '周日', high: '18°', low: '13°', iconKey: 'rainy' as WeatherIconKey },
]
</script>

<template>
  <section class="hourly">
    <header class="head">
      <h2>每小时预报</h2>
      <div class="chips">
        <span class="chip active">概览</span>
        <span class="chip">降水</span>
        <span class="chip">风速</span>
        <span class="chip">湿度</span>
      </div>
    </header>

    <div class="cards">
      <article v-for="item in forecasts" :key="item.day" class="card">
        <p>{{ item.day }}</p>
        <img
          class="weather-icon"
          :src="getWeatherIcon(item.iconKey).src"
          :alt="getWeatherIcon(item.iconKey).alt"
        />
        <p class="temp">{{ item.high }}</p>
        <p class="low">{{ item.low }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.hourly {
  margin-top: 26px;
}

.head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

h2 {
  font-size: 32px;
  font-weight: 700;
  color: var(--cyber-cyan);
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.45);
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  border-radius: 999px;
  padding: 8px 14px;
  background: rgba(6, 24, 52, 0.72);
  border: 1px solid rgba(117, 241, 255, 0.22);
  color: var(--cyber-text-muted);
  transition: all var(--cyber-ease);
}

.chip.active {
  background: linear-gradient(135deg, rgba(0, 214, 255, 0.25), rgba(255, 0, 153, 0.2));
  border-color: rgba(117, 241, 255, 0.55);
  color: var(--cyber-text);
  box-shadow: 0 0 10px rgba(117, 241, 255, 0.35);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
}

.cards {
  margin-top: 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.card {
  border-radius: 14px;
  padding: 12px;
  background: linear-gradient(160deg, rgba(20, 45, 90, 0.82), rgba(8, 24, 52, 0.8));
  border: 1px solid rgba(117, 241, 255, 0.24);
  box-shadow: inset 0 0 14px rgba(117, 241, 255, 0.09);
  text-align: center;
  color: var(--cyber-text);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
}

.weather-icon {
  margin: 10px 0;
  width: 38px;
  height: 38px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(117, 241, 255, 0.72));
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.temp {
  font-size: 26px;
  font-weight: 700;
  color: var(--cyber-cyan);
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.low {
  color: var(--cyber-text-muted);
}

@media (prefers-reduced-motion: reduce) {
  h2,
  .chip.active,
  .card,
  .temp,
  .weather-icon {
    animation: none;
  }
}
</style>
