<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getWeatherIcon, type WeatherIconKey } from '@/components/weather/weatherIconMap'

const props = withDefaults(
  defineProps<{
  cityName: string
  weatherText: string
  temperature: string
  isDefault?: boolean
  }>(),
  {
    isDefault: false,
  },
)

const router = useRouter()

const resolveWeatherIconKey = (weatherText: string): WeatherIconKey => {
  const normalized = weatherText.trim()
  if (!normalized) return 'unknown'
  if (normalized.includes('雪')) return 'snowy'
  if (normalized.includes('雨')) return 'rainy'
  if (normalized.includes('多云')) return 'partly-cloudy'
  if (normalized.includes('阴')) return 'cloudy'
  if (normalized.includes('晴')) return 'sunny'
  return 'unknown'
}

const weatherIcon = computed(() => getWeatherIcon(resolveWeatherIconKey(props.weatherText)))
</script>

<template>
  <article class="city-item" :class="{ 'is-default': props.isDefault }" @click="router.push(`/weather/${props.cityName}`)">
    <span v-if="props.isDefault" class="default-chip">默认城市</span>
    <p class="city-name">{{ props.cityName }}</p>
    <div class="weather-row">
      <img class="weather-icon" :src="weatherIcon.src" :alt="weatherIcon.alt" />
      <span class="weather-text">{{ props.weatherText }}</span>
    </div>
    <strong class="temperature">{{ props.temperature }}</strong>
  </article>
</template>

<style scoped>
.city-item {
  position: relative;
  cursor: pointer;
  aspect-ratio: 1 / 1;
  min-height: 168px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(117, 241, 255, 0.24);
  background: linear-gradient(145deg, rgba(6, 22, 50, 0.78), rgba(4, 16, 36, 0.66));
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.1),
    0 0 8px rgba(117, 241, 255, 0.12);
  transition: transform var(--cyber-ease), border-color var(--cyber-ease), box-shadow var(--cyber-ease),
    filter var(--cyber-ease);
}

.city-item:hover {
  transform: translateY(-2px);
  border-color: rgba(117, 241, 255, 0.52);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.18),
    0 0 12px rgba(117, 241, 255, 0.24),
    0 0 18px rgba(255, 82, 205, 0.12);
}

.city-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #aaf8ff;
  text-shadow:
    0 0 8px rgba(117, 241, 255, 0.86),
    0 0 16px rgba(0, 145, 255, 0.4);
}

.weather-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--cyber-text-muted);
}

.weather-icon {
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 0 8px rgba(117, 241, 255, 0.3));
}

.weather-text {
  font-size: 13px;
  text-shadow:
    0 0 6px rgba(117, 241, 255, 0.42),
    0 0 10px rgba(255, 82, 205, 0.18);
}

.temperature {
  font-size: 28px;
  line-height: 1;
  color: var(--cyber-cyan);
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.92),
    0 0 20px rgba(0, 145, 255, 0.5),
    0 0 24px rgba(255, 82, 205, 0.24);
}

.default-chip {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 210, 120, 0.7);
  background: rgba(65, 45, 0, 0.5);
  color: #ffd784;
  font-size: 11px;
  text-shadow: 0 0 8px rgba(255, 210, 120, 0.45);
}

.city-item.is-default {
  border-color: rgba(255, 210, 120, 0.7);
  background:
    linear-gradient(145deg, rgba(72, 48, 6, 0.28), rgba(30, 18, 2, 0.34)),
    linear-gradient(145deg, rgba(6, 22, 50, 0.78), rgba(4, 16, 36, 0.66));
  box-shadow:
    inset 0 0 16px rgba(255, 210, 120, 0.16),
    0 0 16px rgba(255, 210, 120, 0.24),
    0 0 24px rgba(255, 170, 70, 0.18);
}

.city-item.is-default .city-name,
.city-item.is-default .temperature {
  color: #ffd784;
  text-shadow:
    0 0 8px rgba(255, 210, 120, 0.72),
    0 0 16px rgba(255, 170, 70, 0.34);
}

.city-item.is-default .weather-icon {
  filter: drop-shadow(0 0 10px rgba(255, 210, 120, 0.35));
}

@media (prefers-reduced-motion: reduce) {
  .city-item {
    transition: none;
  }
}
</style>
