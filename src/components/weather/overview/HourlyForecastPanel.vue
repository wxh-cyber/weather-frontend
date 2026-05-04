<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WeatherHourlyItem } from '@/service/weather'
import { getWeatherIcon, type WeatherIconKey } from '@/utils/weather/weatherIconMap'
import TemperatureTrendPanel from '@/components/weather/overview/TemperatureTrendPanel.vue'

const props = withDefaults(
  defineProps<{
    cityName?: string
    temperature?: string
    weatherText?: string
    hourlyItems?: WeatherHourlyItem[]
  }>(),
  {
    cityName: '默认城市',
    temperature: '11°C',
    weatherText: '多云',
  },
)

type PanelMode = 'overview' | 'trend'
type OverviewInterval = '1h' | '2h' | '4h'

type AggregatedForecast = {
  id: string
  timeLabel: string
  iconKey: WeatherIconKey
  high: number | null
  low: number | null
}

const activeMode = ref<PanelMode>('overview')
const overviewInterval = ref<OverviewInterval>('1h')
const isOverviewActive = computed(() => activeMode.value === 'overview')
const isTrendActive = computed(() => activeMode.value === 'trend')

const overviewIntervalOptions: ReadonlyArray<{
  value: OverviewInterval
  label: string
}> = [
  { value: '1h', label: '1小时' },
  { value: '2h', label: '2小时' },
  { value: '4h', label: '4小时' },
]

const parseTemperature = (value?: string) => {
  const parsed = Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) ? parsed : null
}

const formatTemperature = (value: number | null) => {
  if (value === null) {
    return '--'
  }

  return `${value.toFixed(1)}°`
}

const resolveIconKey = (text: string): WeatherIconKey => {
  if (text.includes('雨')) return 'rainy'
  if (text.includes('雪')) return 'snowy'
  if (text.includes('晴')) return 'sunny'
  if (text.includes('阴')) return 'cloudy'
  return 'partly-cloudy'
}

const forecasts = computed<AggregatedForecast[]>(() => {
  const sourceItems = props.hourlyItems ?? []
  const groupSize = overviewInterval.value === '4h' ? 4 : overviewInterval.value === '2h' ? 2 : 1
  const grouped: AggregatedForecast[] = []

  for (let index = 0; index < sourceItems.length; index += groupSize) {
    const group = sourceItems.slice(index, index + groupSize)
    const firstItem = group[0]
    if (!firstItem) {
      continue
    }

    const temperatures = group
      .map((item) => parseTemperature(item.temperature))
      .filter((value): value is number => value !== null)

    grouped.push({
      id: `${firstItem.time}-${groupSize}`,
      timeLabel: firstItem.time.includes('T') ? firstItem.time.slice(11, 16) : firstItem.time,
      iconKey: resolveIconKey(firstItem.weatherText),
      high: temperatures.length ? Math.max(...temperatures) : null,
      low: temperatures.length ? Math.min(...temperatures) : null,
    })
  }

  return grouped
})

const navigateToOverview = () => {
  activeMode.value = 'overview'
}

const navigateToTrend = () => {
  activeMode.value = 'trend'
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
      <div class="head-actions">
        <label
          v-if="isOverviewActive"
          class="interval-select-shell"
          data-testid="hourly-forecast-interval-shell"
        >
          <span class="interval-label">单天间隔</span>
          <select
            v-model="overviewInterval"
            class="interval-select"
            aria-label="小时预报时间间隔"
            data-testid="hourly-forecast-interval-select"
          >
            <option
              v-for="item in overviewIntervalOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </label>

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
      </div>
    </header>

    <div
      v-if="isOverviewActive && forecasts.length"
      class="cards-scroll"
      data-testid="hourly-forecast-scroll"
    >
      <div class="cards" data-testid="hourly-forecast-cards">
      <article v-for="item in forecasts" :key="item.id" class="card">
        <div class="card-grid" aria-hidden="true" />
        <p class="day">{{ item.timeLabel }}</p>
        <img
          class="weather-icon"
          :src="getWeatherIcon(item.iconKey).src"
          :alt="getWeatherIcon(item.iconKey).alt"
        />
        <div class="temp-pair">
          <p class="temp-high">{{ formatTemperature(item.high) }}</p>
          <p class="temp-low">{{ formatTemperature(item.low) }}</p>
        </div>
      </article>
      </div>
    </div>
    <div v-else-if="isOverviewActive" class="state-card" data-testid="hourly-forecast-empty">
      暂无后端小时预报数据
    </div>

    <TemperatureTrendPanel
      v-else-if="isTrendActive"
      :city-name="props.cityName"
      :temperature="props.temperature"
      :hourly-items="props.hourlyItems"
      compact
      show-interval-selector
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

.head-actions {
  display: grid;
  gap: 12px;
  justify-items: end;
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

.interval-select-shell {
  display: inline-grid;
  gap: 8px;
  justify-items: start;
}

.interval-label {
  color: rgba(160, 231, 255, 0.76);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.interval-select {
  min-width: 140px;
  padding: 10px 38px 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(117, 241, 255, 0.28);
  background:
    linear-gradient(135deg, rgba(10, 30, 68, 0.94), rgba(4, 14, 34, 0.96)),
    rgba(3, 13, 32, 0.92);
  color: #effcff;
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.08),
    0 0 20px rgba(117, 241, 255, 0.08);
  outline: none;
  appearance: none;
  background-image:
    linear-gradient(135deg, rgba(10, 30, 68, 0.94), rgba(4, 14, 34, 0.96)),
    linear-gradient(45deg, transparent 50%, rgba(117, 241, 255, 0.92) 50%),
    linear-gradient(135deg, rgba(117, 241, 255, 0.92) 50%, transparent 50%);
  background-repeat: no-repeat;
  background-size:
    100% 100%,
    8px 8px,
    8px 8px;
  background-position:
    0 0,
    calc(100% - 22px) calc(50% - 2px),
    calc(100% - 16px) calc(50% - 2px);
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

.cards-scroll {
  overflow-x: auto;
  padding-bottom: 10px;
}

.cards-scroll::-webkit-scrollbar {
  height: 8px;
}

.cards-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(117, 241, 255, 0.22);
}

.cards {
  display: flex;
  gap: 12px;
  min-width: max-content;
}

.state-card {
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(117, 241, 255, 0.2);
  background: rgba(6, 24, 52, 0.66);
  color: rgba(203, 238, 250, 0.74);
}

.card {
  flex: 0 0 148px;
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 16px 14px 18px;
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
.temp-pair {
  position: relative;
  z-index: 1;
}

.day {
  margin: 0;
  color: rgba(234, 248, 255, 0.82);
}

.weather-icon {
  margin: 14px 0 16px;
  width: 42px;
  height: 42px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(117, 241, 255, 0.72));
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.temp-pair {
  display: grid;
  gap: 8px;
}

.temp-high,
.temp-low {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.temp-high {
  color: #ffbe7a;
  text-shadow: 0 0 10px rgba(255, 183, 106, 0.28);
}

.temp-low {
  color: #90ebff;
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.24);
}

@media (max-width: 720px) {
  .head-actions {
    width: 100%;
    justify-items: stretch;
  }

  .interval-select-shell,
  .chip-dock {
    width: 100%;
  }

  .interval-select {
    width: 100%;
  }

  .chip {
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  h2,
  .card,
  .temp-high,
  .temp-low,
  .weather-icon {
    animation: none;
  }
}
</style>
