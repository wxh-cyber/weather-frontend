<script setup lang="ts">
import { computed } from 'vue'
import type { WeatherCurrentData } from '@/service/weather'
import { resolveDisplayCityName } from '@/utils/weather/cityNameDisplay'
import { getWeatherIcon } from '@/utils/weather/weatherIconMap'

const props = withDefaults(
  defineProps<{
    cityName?: string
    temperature?: string
    weatherText?: string
    currentWeather?: WeatherCurrentData | null
  }>(),
  {
    cityName: '默认城市',
    temperature: '11°C',
    weatherText: '多云',
  },
)

const displayCityName = computed(() => resolveDisplayCityName(props.cityName))
const displayTemperature = computed(() => props.currentWeather?.temperature ?? props.temperature)
const displayWeatherText = computed(() => props.currentWeather?.weatherText ?? props.weatherText)
const formatObservedAt = (value?: string) => {
  if (!value) {
    return '--'
  }

  const matched = value.match(/T(\d{2}:\d{2})/)
  return matched?.[1] ?? value
}

const backendValue = (value?: string) => value || '--'

const metrics = computed(() => {
  const current = props.currentWeather
  return [
    { label: '空气质量', value: backendValue(current?.airQuality), tone: 'aqua' },
    { label: '风速', value: [current?.windDirection, current?.windSpeed].filter(Boolean).join(' ') || '--', tone: 'cyan' },
    { label: '降水概率', value: backendValue(current?.precipitationProbability), tone: 'rain' },
    { label: '降水量', value: backendValue(current?.precipitationAmount), tone: 'rain' },
    { label: '云量', value: backendValue(current?.cloudCover), tone: 'cloud' },
  ]
})

const statusItems = computed(() => [
  { label: '观测时间', value: formatObservedAt(props.currentWeather?.observedAt) },
  { label: '数据源', value: backendValue(props.currentWeather?.source) },
  { label: '更新状态', value: props.currentWeather ? 'ONLINE' : '--' },
])

const currentIconKey = computed(() => {
  const text = displayWeatherText.value
  if (text.includes('雨')) return 'rainy'
  if (text.includes('雪')) return 'snowy'
  if (text.includes('晴')) return 'sunny'
  if (text.includes('阴')) return 'cloudy'
  return 'night-cloudy'
})

const currentIcon = computed(() => getWeatherIcon(currentIconKey.value))
const feelLike = computed(() => props.currentWeather?.apparentTemperature ?? '--')
const tipText = computed(() => `${displayCityName.value}当前以${displayWeatherText.value}为主，所有环境指标均来自后端实时天气链路。`)
</script>

<template>
  <article class="panel">
    <div class="panel-head">
      <div>
        <p class="subtitle">CURRENT ATMOSPHERE</p>
        <h3>{{ displayCityName }}实时天气</h3>
      </div>
      <p class="city-tag">{{ displayCityName }}</p>
    </div>

    <section class="hero">
      <div class="hero-orbit" aria-hidden="true" />
      <img class="icon weather-icon" :src="currentIcon.src" :alt="currentIcon.alt" />
      <div class="hero-copy">
        <p class="temp">{{ displayTemperature }}</p>
        <p class="desc">{{ displayWeatherText }} · 体感温度 {{ feelLike }}</p>
      </div>
      <div class="hero-badge">
        <span>BACKEND DATA</span>
        <strong>{{ statusItems[2]?.value }}</strong>
      </div>
    </section>

    <div class="status-strip">
      <div v-for="item in statusItems" :key="item.label" class="status-item">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>

    <p class="tips">{{ tipText }}</p>

    <div class="metrics">
      <div v-for="item in metrics" :key="item.label" class="metric" :class="`metric--${item.tone}`">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>
  </article>
</template>

<style scoped>
.panel {
  padding: 20px 22px;
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background:
    radial-gradient(circle at 18% 18%, rgba(117, 241, 255, 0.16), transparent 28%),
    radial-gradient(circle at 86% 20%, rgba(82, 129, 255, 0.12), transparent 30%),
    linear-gradient(160deg, rgba(18, 44, 86, 0.9) 0%, rgba(10, 28, 58, 0.88) 100%);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.12),
    var(--cyber-glow-md);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
  overflow: hidden;
  position: relative;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.subtitle {
  margin: 0 0 4px;
  color: var(--cyber-text-muted);
  font-size: 11px;
  letter-spacing: 0.22em;
}

h3 {
  margin: 0;
  color: #f1fdff;
  font-size: 22px;
  text-shadow: 0 0 14px rgba(117, 241, 255, 0.28);
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

.hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 14px 0 12px;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  background:
    linear-gradient(135deg, rgba(117, 241, 255, 0.1), transparent 45%),
    rgba(4, 18, 42, 0.56);
  box-shadow:
    inset 0 0 20px rgba(117, 241, 255, 0.08),
    0 14px 30px rgba(0, 0, 0, 0.16);
  overflow: hidden;
}

.hero-orbit {
  position: absolute;
  width: 152px;
  height: 152px;
  right: -46px;
  top: -58px;
  border-radius: 50%;
  border: 1px solid rgba(117, 241, 255, 0.16);
  box-shadow:
    0 0 30px rgba(117, 241, 255, 0.1),
    inset 0 0 28px rgba(117, 241, 255, 0.08);
}

.hero-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.hero-badge {
  position: relative;
  z-index: 1;
  margin-left: auto;
  display: grid;
  gap: 6px;
  justify-items: end;
  padding: 9px 12px;
  border-radius: 14px;
  border: 1px solid rgba(117, 241, 255, 0.22);
  background: rgba(3, 13, 32, 0.58);
}

.hero-badge span {
  color: rgba(160, 231, 255, 0.72);
  font-size: 10px;
  letter-spacing: 0.16em;
}

.hero-badge strong {
  color: var(--cyber-cyan);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.weather-icon {
  filter: drop-shadow(0 0 10px rgba(117, 241, 255, 0.72));
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.temp {
  margin: 0;
  font-size: 52px;
  font-weight: 700;
  line-height: 1;
  color: var(--cyber-cyan);
  text-shadow: 0 0 14px rgba(117, 241, 255, 0.6);
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.desc {
  margin: 6px 0 0;
  color: var(--cyber-text-muted);
}

.tips {
  margin: 12px 0;
  color: rgba(218, 245, 255, 0.78);
  line-height: 1.6;
}

.status-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.status-item {
  display: grid;
  gap: 5px;
  padding: 9px 12px;
  border-radius: 14px;
  border: 1px solid rgba(117, 241, 255, 0.16);
  background: rgba(6, 24, 52, 0.52);
}

.status-item span {
  color: rgba(160, 231, 255, 0.7);
  font-size: 11px;
}

.status-item strong {
  color: #f3fdff;
  font-size: 13px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.metric {
  border-radius: 12px;
  padding: 11px 12px;
  background:
    linear-gradient(160deg, rgba(117, 241, 255, 0.06), transparent 74%),
    rgba(6, 24, 52, 0.66);
  border: 1px solid rgba(117, 241, 255, 0.2);
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--cyber-text-muted);
  min-height: 68px;
  justify-content: space-between;
}

.metric strong {
  color: var(--cyber-text);
  font-size: 16px;
  line-height: 1.2;
}

.metric--rain {
  border-color: rgba(111, 208, 255, 0.3);
}

.metric--cloud {
  border-color: rgba(189, 220, 255, 0.26);
}

.metric--aqua strong,
.metric--cyan strong {
  color: var(--cyber-cyan);
}

.metric--rain strong {
  color: #9de9ff;
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  .temp,
  .weather-icon {
    animation: none;
  }
}

@media (max-width: 720px) {
  .hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-badge {
    margin-left: 0;
    justify-items: start;
  }

  .status-strip,
  .metrics {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) and (min-width: 721px) {
  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
