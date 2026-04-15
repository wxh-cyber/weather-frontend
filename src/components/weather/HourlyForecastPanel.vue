<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWeatherIcon, type WeatherIconKey } from '@/utils/weather/weatherIconMap'
import TemperatureTrendPanel from '@/components/weather/TemperatureTrendPanel.vue'

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

const route = useRoute()
const router = useRouter()

const citySeed = computed(() => Array.from(props.cityName).reduce((sum, char) => sum + char.charCodeAt(0), 0))
const baseTemp = computed(() => {
  const value = Number.parseInt(props.temperature, 10)
  return Number.isNaN(value) ? 11 : value
})

const isOverviewActive = computed(() => route.name === 'city-detail')
const isTrendActive = computed(() => route.name === 'city-temperature-trend')

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
      pulse: `${62 + ((citySeed.value + index * 9) % 31)}%`,
    }
  })
})

const navigateToOverview = () => {
  if (isOverviewActive.value) {
    return
  }

  void router.push({
    name: 'city-detail',
    params: { cityName: props.cityName },
  })
}

const navigateToTrend = () => {
  if (isTrendActive.value) {
    return
  }

  void router.push({
    name: 'city-temperature-trend',
    params: { cityName: props.cityName },
  })
}
</script>

<template>
  <section class="hourly">
    <header class="head">
      <div>
        <p class="eyebrow">TACTICAL FORECAST ARRAY</p>
        <h2>{{ props.cityName }}趋势预报</h2>
        <p class="head-note">短时预报与温度轨迹联动聚合在同一控制台中，保持暗色科幻观测体验。</p>
      </div>
      <div class="chip-dock" role="tablist" aria-label="详情切换">
        <button
          type="button"
          class="chip"
          :class="{ active: isOverviewActive }"
          @click="navigateToOverview"
        >
          概览
        </button>
        <button
          type="button"
          class="chip"
          :class="{ active: isTrendActive }"
          @click="navigateToTrend"
        >
          温度轨迹
        </button>
        <button type="button" class="chip chip--ghost" aria-disabled="true">
          风场扫描
        </button>
      </div>
    </header>

    <div v-if="isOverviewActive" class="cards" data-testid="hourly-forecast-cards">
      <article v-for="item in forecasts" :key="item.day" class="card">
        <div class="card-grid" aria-hidden="true" />
        <p class="day">{{ item.day }}</p>
        <img
          class="weather-icon"
          :src="getWeatherIcon(item.iconKey).src"
          :alt="getWeatherIcon(item.iconKey).alt"
        />
        <p class="temp">{{ item.high }}</p>
        <p class="low">{{ item.low }}</p>
        <span class="pulse-track" :style="{ width: item.pulse }" />
      </article>
    </div>

    <TemperatureTrendPanel
      v-else-if="isTrendActive"
      :city-name="props.cityName"
      :temperature="props.temperature"
      compact
    />
  </section>
</template>

<style scoped>
.hourly {
  margin-top: 26px;
  display: grid;
  gap: 14px;
}

.head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.eyebrow {
  margin: 0 0 8px;
  color: rgba(117, 241, 255, 0.68);
  font-size: 11px;
  letter-spacing: 0.28em;
}

h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: var(--cyber-cyan);
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.45),
    0 0 20px rgba(82, 129, 255, 0.12);
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.head-note {
  margin: 8px 0 0;
  color: rgba(203, 238, 250, 0.7);
  max-width: 560px;
  line-height: 1.7;
}

.chip-dock {
  display: inline-grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  padding: 6px;
  border-radius: 18px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  background:
    linear-gradient(135deg, rgba(0, 214, 255, 0.08), rgba(255, 0, 153, 0.05)),
    rgba(3, 13, 32, 0.86);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.08),
    0 16px 36px rgba(0, 0, 0, 0.2);
}

.chip {
  min-width: 114px;
  border-radius: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.08), transparent 70%),
    rgba(4, 18, 42, 0.74);
  color: rgba(217, 245, 255, 0.74);
  transition:
    border-color var(--cyber-ease),
    color var(--cyber-ease),
    transform var(--cyber-ease),
    box-shadow var(--cyber-ease),
    background var(--cyber-ease);
}

.chip:hover {
  color: #f4feff;
  border-color: rgba(117, 241, 255, 0.42);
  transform: translateY(-1px);
  box-shadow: 0 0 14px rgba(117, 241, 255, 0.14);
}

.chip.active {
  background:
    linear-gradient(135deg, rgba(85, 230, 255, 0.26), rgba(128, 84, 255, 0.18)),
    rgba(7, 28, 62, 0.92);
  border-color: rgba(148, 245, 255, 0.62);
  color: #f4feff;
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.18),
    0 0 18px rgba(117, 241, 255, 0.16);
}

.chip--ghost {
  opacity: 0.56;
}

.cards {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
}

.card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 14px 12px 16px;
  background: linear-gradient(160deg, rgba(20, 45, 90, 0.82), rgba(8, 24, 52, 0.8));
  border: 1px solid rgba(117, 241, 255, 0.24);
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.09),
    0 14px 24px rgba(0, 0, 0, 0.16);
  text-align: center;
  color: var(--cyber-text);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
}

.card-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(117, 241, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(117, 241, 255, 0.04) 1px, transparent 1px);
  background-size: 20px 20px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.85), transparent 100%);
}

.day,
.weather-icon,
.temp,
.low,
.pulse-track {
  position: relative;
  z-index: 1;
}

.day {
  margin: 0;
  color: rgba(234, 248, 255, 0.82);
}

.weather-icon {
  margin: 12px 0 10px;
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(117, 241, 255, 0.72));
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.temp {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--cyber-cyan);
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.low {
  margin: 6px 0 0;
  color: var(--cyber-text-muted);
}

.pulse-track {
  display: block;
  height: 5px;
  margin: 14px auto 0;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(88, 224, 255, 0.92), rgba(255, 0, 153, 0.6));
  box-shadow: 0 0 12px rgba(117, 241, 255, 0.22);
}

@media (max-width: 720px) {
  .chip-dock {
    width: 100%;
  }

  .chip {
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  h2,
  .card,
  .temp,
  .weather-icon {
    animation: none;
  }
}
</style>
