<script setup lang="ts">
import { computed } from 'vue'
import { resolveDisplayCityName } from '@/utils/weather/cityNameDisplay'
import { getWeatherIcon } from '@/utils/weather/weatherIconMap'

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

const displayCityName = computed(() => resolveDisplayCityName(props.cityName))

const citySeed = computed(() => Array.from(displayCityName.value).reduce((sum, char) => sum + char.charCodeAt(0), 0))

const metrics = computed(() => {
  const seed = citySeed.value
  return [
    { label: '空气质量', value: `${22 + (seed % 18)}` },
    { label: '风速', value: `东北风 ${1 + (seed % 4)}级` },
    { label: '湿度', value: `${58 + (seed % 27)}%` },
    { label: '能见度', value: `${12 + (seed % 7)}.${seed % 10} 公里` },
    { label: '气压', value: `${1008 + (seed % 11)} hPa` },
    { label: '露点', value: `${5 + (seed % 7)}°` },
  ]
})

const currentIconKey = computed(() => {
  const text = props.weatherText
  if (text.includes('雨')) return 'rainy'
  if (text.includes('雪')) return 'snowy'
  if (text.includes('晴')) return 'sunny'
  if (text.includes('阴')) return 'cloudy'
  return 'night-cloudy'
})

const currentIcon = computed(() => getWeatherIcon(currentIconKey.value))
const feelLike = computed(() => {
  const temperature = Number.parseInt(props.temperature, 10)
  if (Number.isNaN(temperature)) return '--'
  return `${temperature - 2}°`
})
const tipText = computed(() => `${displayCityName.value}今天以${props.weatherText}为主，夜间体感会更清凉。`)
</script>

<template>
  <article class="panel">
    <div class="panel-head">
      <p class="subtitle">当前天气</p>
      <p class="city-tag">{{ displayCityName }}</p>
    </div>
    <div class="temp-row">
      <img class="icon weather-icon" :src="currentIcon.src" :alt="currentIcon.alt" />
      <div>
        <p class="temp">{{ props.temperature }}</p>
        <p class="desc">{{ props.weatherText }} · 体感温度 {{ feelLike }}</p>
      </div>
    </div>
    <p class="tips">{{ tipText }}</p>
    <div class="metrics">
      <div v-for="item in metrics" :key="item.label" class="metric">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>
  </article>
</template>

<style scoped>
.panel {
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background: linear-gradient(160deg, rgba(18, 44, 86, 0.88) 0%, rgba(10, 28, 58, 0.86) 100%);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.12),
    var(--cyber-glow-md);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.subtitle {
  color: var(--cyber-text-muted);
}

.city-tag {
  margin: 0;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(117, 241, 255, 0.24);
  background: rgba(7, 24, 56, 0.58);
  color: var(--cyber-cyan);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.temp-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 12px 0;
}

.icon {
  width: 58px;
  height: 58px;
  object-fit: contain;
}

.weather-icon {
  filter: drop-shadow(0 0 10px rgba(117, 241, 255, 0.72));
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.temp {
  font-size: 58px;
  font-weight: 700;
  line-height: 1;
  color: var(--cyber-cyan);
  text-shadow: 0 0 14px rgba(117, 241, 255, 0.6);
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.desc {
  color: var(--cyber-text-muted);
}

.tips {
  margin: 16px 0;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.metric {
  border-radius: 12px;
  padding: 10px;
  background: rgba(6, 24, 52, 0.66);
  border: 1px solid rgba(117, 241, 255, 0.2);
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--cyber-text-muted);
}

.metric strong {
  color: var(--cyber-text);
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  .temp,
  .weather-icon {
    animation: none;
  }
}
</style>
