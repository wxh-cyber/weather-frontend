<script setup lang="ts">
import { computed } from 'vue'
import { getWeatherIcon, type WeatherIconKey } from '@/components/weather/weatherIconMap'

const props = withDefaults(
  defineProps<{
    cityName?: string
    temperature?: string
    weatherText?: string
  }>(),
  {
    cityName: '默认城市',
    temperature: '11°C',
    weatherText: '多云',
  },
)

const citySeed = computed(() => Array.from(props.cityName).reduce((sum, char) => sum + char.charCodeAt(0), 0))
const baseTemp = computed(() => {
  const value = Number.parseInt(props.temperature, 10)
  return Number.isNaN(value) ? 11 : value
})

const resolveIconKey = (offset: number): WeatherIconKey => {
  const text = props.weatherText
  if (text.includes('雨')) return offset % 2 === 0 ? 'rainy' : 'cloudy'
  if (text.includes('雪')) return 'snowy'
  if (text.includes('晴')) return offset % 2 === 0 ? 'sunny' : 'partly-cloudy'
  if (text.includes('阴')) return 'cloudy'
  return offset % 2 === 0 ? 'night-cloudy' : 'partly-cloudy'
}

const forecasts = computed(() => {
  const days = ['今天', '今晚', '明天', '周五', '周六', '周日']
  return days.map((day, index) => {
    const high = `${baseTemp.value + ((citySeed.value + index) % 5)}°`
    const low = `${baseTemp.value - 2 + ((citySeed.value + index) % 3)}°`
    return {
      day,
      high,
      low,
      iconKey: resolveIconKey(index),
    }
  })
})
</script>

<template>
  <section class="hourly">
    <header class="head">
      <div>
        <h2>{{ props.cityName }}趋势预报</h2>
        <p class="head-note">以下内容为基于当前城市天气状态生成的联动概览。</p>
      </div>
      <div class="chips">
        <span class="chip active">概览</span>
        <span class="chip">{{ props.weatherText }}</span>
        <span class="chip">温度轨迹</span>
        <span class="chip">风场扫描</span>
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

.head-note {
  margin: 6px 0 0;
  color: rgba(203, 238, 250, 0.7);
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
