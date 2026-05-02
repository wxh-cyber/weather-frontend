<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getDailyWeatherDetail, type DailyWeatherDetailItem, type DayPeriodMetrics } from '@/service/weather'
import { getWeatherIcon, type WeatherIconKey } from '@/utils/weather/weatherIconMap'
import type { CityItem } from '@/store/city'
import feelsLikeIcon from '@/assets/information/体感温度.svg'
import precipitationProbabilityIcon from '@/assets/information/降水概率.svg'
import precipitationAmountIcon from '@/assets/information/降水量.svg'
import airQualityIcon from '@/assets/information/空气质量.svg'
import windDirectionIcon from '@/assets/information/风向.svg'
import cloudCoverIcon from '@/assets/information/云量.svg'
import sunriseIcon from '@/assets/information/日出.svg'
import sunsetIcon from '@/assets/information/日落.svg'

const props = defineProps<{
  city: CityItem
}>()

type DayPeriod = 'day' | 'night'

const activePeriod = ref<DayPeriod>('day')
const loading = ref(false)
const errorMessage = ref('')
const detailItems = ref<DailyWeatherDetailItem[]>([])
const selectedIndex = ref(0)

const metricCards = computed(() => {
  const metrics = currentMetrics.value
  return [
    {
      key: 'feelsLike',
      label: '体感温度',
      value: metrics.feelsLike,
      iconSrc: feelsLikeIcon,
      iconAlt: '体感温度图标',
    },
    {
      key: 'precipitationProbability',
      label: '降水概率',
      value: metrics.precipitationProbability,
      iconSrc: precipitationProbabilityIcon,
      iconAlt: '降水概率图标',
    },
    {
      key: 'precipitationAmount',
      label: '降水量',
      value: metrics.precipitationAmount,
      iconSrc: precipitationAmountIcon,
      iconAlt: '降水量图标',
    },
    {
      key: 'airQuality',
      label: '空气质量',
      value: metrics.airQuality,
      iconSrc: airQualityIcon,
      iconAlt: '空气质量图标',
    },
    {
      key: 'windDirection',
      label: '风向',
      value: metrics.windDirection,
      iconSrc: windDirectionIcon,
      iconAlt: '风向图标',
    },
    {
      key: 'cloudCover',
      label: '云量',
      value: metrics.cloudCover,
      iconSrc: cloudCoverIcon,
      iconAlt: '云量图标',
    },
  ]
})

const hasPreviousDate = computed(() => selectedIndex.value > 0)
const hasNextDate = computed(() => selectedIndex.value < detailItems.value.length - 1)
const currentItem = computed(() => detailItems.value[selectedIndex.value] ?? null)
const currentWeatherText = computed(() =>
  activePeriod.value === 'day'
    ? currentItem.value?.dayWeatherText ?? '未知'
    : currentItem.value?.nightWeatherText ?? '未知',
)
const currentMetrics = computed<DayPeriodMetrics>(() =>
  activePeriod.value === 'day'
    ? currentItem.value?.dayMetrics ?? emptyMetrics
    : currentItem.value?.nightMetrics ?? emptyMetrics,
)
const currentIcon = computed(() => getWeatherIcon(resolveWeatherIconKey(currentWeatherText.value, activePeriod.value)))
const currentDateLabel = computed(() => formatDisplayDate(currentItem.value?.date))
const periodModeClass = computed(() => activePeriod.value === 'day' ? 'is-day-mode' : 'is-night-mode')

const emptyMetrics: DayPeriodMetrics = {
  feelsLike: '--',
  precipitationProbability: '--',
  precipitationAmount: '--',
  airQuality: '--',
  windDirection: '--',
  cloudCover: '--',
}

const selectPreviousDate = () => {
  if (!hasPreviousDate.value) {
    return
  }

  selectedIndex.value -= 1
}

const selectNextDate = () => {
  if (!hasNextDate.value) {
    return
  }

  selectedIndex.value += 1
}

const setPeriod = (period: DayPeriod) => {
  activePeriod.value = period
}

const fetchDailyDetail = async () => {
  if (!props.city.cityId) {
    detailItems.value = []
    errorMessage.value = '当前城市缺少可用天气数据'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getDailyWeatherDetail(props.city.cityId)
    detailItems.value = response.data.items
    selectedIndex.value = getTodayIndex(response.data.items)
    activePeriod.value = getInitialPeriod()
  } catch (error) {
    detailItems.value = []
    errorMessage.value = error instanceof Error ? error.message : '单日天气获取失败'
  } finally {
    loading.value = false
  }
}

watch(() => props.city.cityId, () => {
  void fetchDailyDetail()
}, { immediate: true })

onMounted(() => {
  if (!detailItems.value.length) {
    void fetchDailyDetail()
  }
})

function getTodayIndex(items: DailyWeatherDetailItem[]) {
  const today = new Date().toISOString().slice(0, 10)
  const foundIndex = items.findIndex((item) => item.date === today)
  return foundIndex >= 0 ? foundIndex : 0
}

function getInitialPeriod(): DayPeriod {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'day' : 'night'
}

function formatDisplayDate(value?: string) {
  if (!value) {
    return '--'
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

function resolveWeatherIconKey(text: string, period: DayPeriod): WeatherIconKey {
  if (period === 'night') {
    if (text.includes('雪')) return 'snowy'
    if (text.includes('雨')) return 'rainy'
    return 'night-cloudy'
  }

  if (text.includes('晴')) return 'sunny'
  if (text.includes('云')) return 'partly-cloudy'
  if (text.includes('阴')) return 'cloudy'
  if (text.includes('雨')) return 'rainy'
  if (text.includes('雪')) return 'snowy'
  return 'unknown'
}
</script>

<template>
  <section class="daily-panel" data-testid="daily-weather-panel">
    <div class="panel-shell">
      <header class="panel-head">
        <div class="title-stack">
          <p class="eyebrow">SINGLE DAY WEATHER CAPSULE</p>
          <h2>{{ props.city.cityName }} 单日天气</h2>
          <p class="head-note">昼夜切换、日期推演与六项环境指标收束在同一仪表台，保持城市详情页统一的暗色科幻观测感。</p>
        </div>

        <div class="period-switch" role="tablist" aria-label="昼夜切换">
          <button
            type="button"
            class="period-chip"
            :class="{ 'is-active': activePeriod === 'day' }"
            @click="setPeriod('day')"
          >
            白天
          </button>
          <button
            type="button"
            class="period-chip"
            :class="{ 'is-active': activePeriod === 'night' }"
            @click="setPeriod('night')"
          >
            夜间
          </button>
        </div>
      </header>

      <div v-if="errorMessage" class="state-card state-card--error">{{ errorMessage }}</div>
      <div v-else-if="loading" class="state-card">天气舱正在同步数据...</div>

      <div v-else class="panel-grid">
        <article class="hero-card" :class="periodModeClass">
          <div class="hero-top">
            <button
              type="button"
              class="arrow-button"
              :disabled="!hasPreviousDate"
              aria-label="切换到前一天"
              @click="selectPreviousDate"
            >
              ‹
            </button>
            <div class="date-block">
              <p class="date-label">{{ currentDateLabel }}</p>
              <p class="date-raw">{{ currentItem?.date ?? '--' }}</p>
            </div>
            <button
              type="button"
              class="arrow-button"
              :disabled="!hasNextDate"
              aria-label="切换到后一天"
              @click="selectNextDate"
            >
              ›
            </button>
          </div>

          <div class="hero-main">
            <img class="hero-icon" :src="currentIcon.src" :alt="currentIcon.alt" />
            <div class="hero-reading">
              <p class="weather-text">{{ currentWeatherText }}</p>
              <div class="temp-row">
                <span class="temp-high">{{ currentItem?.temperatureMax ?? '--' }}</span>
                <span class="temp-separator">/</span>
                <span class="temp-low">{{ currentItem?.temperatureMin ?? '--' }}</span>
              </div>
              <p
                class="period-mark"
                :data-testid="`daily-weather-period-mark-${activePeriod}`"
              >
                {{ activePeriod === 'day' ? '白天态势' : '夜间态势' }}
              </p>
            </div>
          </div>

          <div class="sun-cycle">
            <div class="sun-slot">
              <span class="sun-label">
                <img
                  class="sun-icon"
                  :src="sunriseIcon"
                  alt="日出图标"
                  data-testid="daily-weather-sunrise-icon"
                />
                <span>日出</span>
              </span>
              <strong>{{ currentItem?.sunrise ?? '--' }}</strong>
            </div>
            <div class="sun-divider" />
            <div class="sun-slot">
              <span class="sun-label">
                <img
                  class="sun-icon"
                  :src="sunsetIcon"
                  alt="日落图标"
                  data-testid="daily-weather-sunset-icon"
                />
                <span>日落</span>
              </span>
              <strong>{{ currentItem?.sunset ?? '--' }}</strong>
            </div>
          </div>
        </article>

        <article class="metrics-card">
          <div class="metrics-head">
            <p class="metrics-eyebrow">PERIOD METRICS</p>
            <h3>环境指标矩阵</h3>
          </div>

          <div class="metrics-grid">
            <article
              v-for="card in metricCards"
              :key="card.key"
              class="metric-item"
              :data-testid="`daily-weather-metric-${card.key}`"
            >
              <span class="metric-icon-shell">
                <img
                  class="metric-icon"
                  :src="card.iconSrc"
                  :alt="card.iconAlt"
                  :data-testid="`daily-weather-metric-icon-${card.key}`"
                />
              </span>
              <span class="metric-label">{{ card.label }}</span>
              <strong class="metric-value">{{ card.value || '--' }}</strong>
            </article>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.daily-panel {
  min-width: 0;
}

.panel-shell {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 16px;
  padding: 24px;
  border-radius: 28px;
  border: 1px solid rgba(117, 241, 255, 0.22);
  background:
    radial-gradient(circle at top right, rgba(66, 214, 255, 0.15), transparent 36%),
    radial-gradient(circle at bottom left, rgba(255, 74, 180, 0.12), transparent 30%),
    linear-gradient(160deg, rgba(6, 20, 44, 0.94), rgba(2, 10, 24, 0.98));
  box-shadow:
    inset 0 0 22px rgba(117, 241, 255, 0.08),
    0 28px 52px rgba(0, 0, 0, 0.32);
}

.panel-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(117, 241, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(117, 241, 255, 0.045) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.86), transparent 100%);
  pointer-events: none;
}

.panel-head,
.panel-grid,
.state-card {
  position: relative;
  z-index: 1;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.eyebrow,
.metrics-eyebrow {
  margin: 0 0 8px;
  color: rgba(117, 241, 255, 0.68);
  font-size: 11px;
  letter-spacing: 0.3em;
}

.title-stack h2,
.metrics-head h3 {
  margin: 0;
  color: var(--cyber-cyan);
}

.title-stack h2 {
  font-size: 34px;
  text-shadow:
    0 0 14px rgba(117, 241, 255, 0.34),
    0 0 26px rgba(58, 129, 255, 0.12);
}

.head-note {
  max-width: 720px;
  margin: 8px 0 0;
  color: rgba(208, 237, 255, 0.74);
  line-height: 1.75;
}

.period-switch {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 8px;
  border-radius: 18px;
  border: 1px solid rgba(117, 241, 255, 0.22);
  background:
    linear-gradient(135deg, rgba(0, 214, 255, 0.09), rgba(255, 0, 153, 0.06)),
    rgba(3, 14, 34, 0.88);
}

.period-chip,
.arrow-button {
  border: 1px solid rgba(117, 241, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.08), transparent 74%),
    rgba(4, 18, 42, 0.86);
  color: rgba(225, 246, 255, 0.8);
  cursor: pointer;
  transition:
    transform var(--cyber-ease),
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    color var(--cyber-ease);
}

.period-chip {
  min-width: 110px;
  padding: 12px 16px;
  border-radius: 14px;
}

.period-chip.is-active {
  border-color: rgba(117, 241, 255, 0.56);
  color: #f7ffff;
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.18),
    0 0 22px rgba(117, 241, 255, 0.14);
}

.panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 18px;
}

.hero-card,
.metrics-card,
.state-card {
  border-radius: 24px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  background:
    linear-gradient(160deg, rgba(10, 28, 58, 0.88), rgba(3, 14, 32, 0.92));
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.08),
    0 18px 36px rgba(0, 0, 0, 0.22);
}

.hero-card {
  padding: 22px;
  display: grid;
  gap: 22px;
  transition:
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    background var(--cyber-ease);
}

.hero-card.is-day-mode {
  border-color: rgba(255, 189, 92, 0.26);
  background:
    radial-gradient(circle at top right, rgba(255, 180, 76, 0.16), transparent 34%),
    linear-gradient(160deg, rgba(30, 24, 18, 0.82), rgba(8, 16, 34, 0.92));
  box-shadow:
    inset 0 0 18px rgba(255, 194, 94, 0.08),
    0 18px 36px rgba(0, 0, 0, 0.22);
}

.hero-card.is-night-mode {
  border-color: rgba(117, 241, 255, 0.18);
}

.hero-top {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.arrow-button {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  font-size: 26px;
  line-height: 1;
}

.arrow-button:disabled {
  opacity: 0.36;
  cursor: not-allowed;
}

.arrow-button:not(:disabled):hover,
.period-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(117, 241, 255, 0.44);
  box-shadow: 0 0 18px rgba(117, 241, 255, 0.12);
}

.date-block {
  min-width: 0;
  text-align: center;
}

.date-label {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #effdff;
}

.date-raw {
  margin: 8px 0 0;
  color: rgba(168, 216, 255, 0.6);
  letter-spacing: 0.08em;
}

.hero-main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px;
  align-items: center;
}

.hero-icon {
  width: 92px;
  height: 92px;
  object-fit: contain;
  filter: drop-shadow(0 0 16px rgba(117, 241, 255, 0.38));
}

.weather-text,
.period-mark,
.temp-row {
  margin: 0;
}

.weather-text {
  color: rgba(223, 247, 255, 0.82);
  font-size: 18px;
  letter-spacing: 0.08em;
}

.temp-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-top: 10px;
}

.temp-high,
.temp-low {
  font-weight: 700;
}

.temp-high {
  font-size: 42px;
  color: var(--cyber-cyan);
}

.temp-low {
  font-size: 26px;
  color: rgba(209, 238, 255, 0.64);
}

.temp-separator {
  color: rgba(117, 241, 255, 0.34);
  font-size: 20px;
}

.period-mark {
  margin-top: 12px;
  color: rgba(255, 99, 185, 0.72);
  letter-spacing: 0.12em;
  transition:
    color var(--cyber-ease),
    text-shadow var(--cyber-ease);
}

.hero-card.is-day-mode .period-mark {
  color: rgba(255, 200, 118, 0.92);
  text-shadow:
    0 0 10px rgba(255, 189, 88, 0.28),
    0 0 22px rgba(255, 127, 52, 0.14);
}

.hero-card.is-night-mode .period-mark {
  color: rgba(132, 230, 255, 0.84);
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.2),
    0 0 22px rgba(88, 153, 255, 0.1);
}

.sun-cycle {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(9, 28, 58, 0.92), rgba(4, 16, 36, 0.92));
  border: 1px solid rgba(117, 241, 255, 0.16);
}

.sun-slot {
  display: grid;
  gap: 8px;
}

.sun-slot strong {
  color: #f7fdff;
  font-size: 24px;
}

.sun-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(170, 218, 255, 0.62);
  letter-spacing: 0.12em;
}

.sun-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter:
    drop-shadow(0 0 6px rgba(117, 241, 255, 0.18))
    brightness(1.08);
}

.hero-card.is-day-mode .sun-icon {
  filter:
    drop-shadow(0 0 7px rgba(255, 183, 77, 0.24))
    brightness(1.12);
}

.sun-divider {
  width: 1px;
  height: 46px;
  background: linear-gradient(180deg, transparent, rgba(117, 241, 255, 0.56), transparent);
}

.metrics-card {
  padding: 22px;
  display: grid;
  gap: 18px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-item {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 10px;
  min-height: 126px;
  padding: 16px 14px;
  border-radius: 18px;
  border: 1px solid rgba(117, 241, 255, 0.14);
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.08), transparent 64%),
    rgba(5, 18, 44, 0.78);
  transition:
    transform var(--cyber-ease),
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    background var(--cyber-ease);
}

.metric-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(117, 241, 255, 0.1), transparent 42%),
    radial-gradient(circle at 82% 18%, rgba(255, 92, 190, 0.1), transparent 28%);
  opacity: 0.86;
  pointer-events: none;
}

.metric-item:hover {
  transform: translateY(-2px);
  border-color: rgba(117, 241, 255, 0.3);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.09),
    0 12px 24px rgba(0, 0, 0, 0.18),
    0 0 18px rgba(117, 241, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.11), transparent 64%),
    rgba(5, 18, 44, 0.84);
}

.metric-icon-shell {
  position: relative;
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  border: 1px solid rgba(117, 241, 255, 0.34);
  background:
    radial-gradient(circle at 35% 35%, rgba(117, 241, 255, 0.28), transparent 54%),
    linear-gradient(135deg, rgba(117, 241, 255, 0.2), rgba(255, 73, 179, 0.14)),
    rgba(6, 20, 46, 0.94);
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 18px rgba(117, 241, 255, 0.12);
  transition:
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    transform var(--cyber-ease),
    background var(--cyber-ease);
}

.metric-icon-shell::before {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 10px;
  border: 1px solid rgba(117, 241, 255, 0.1);
  background: linear-gradient(180deg, rgba(117, 241, 255, 0.06), transparent 72%);
  pointer-events: none;
}

.metric-icon {
  position: relative;
  z-index: 1;
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter:
    drop-shadow(0 0 7px rgba(117, 241, 255, 0.42))
    drop-shadow(0 0 14px rgba(117, 241, 255, 0.16))
    brightness(1.16)
    saturate(0.92)
    contrast(1.05);
  opacity: 0.94;
  transition:
    filter var(--cyber-ease),
    opacity var(--cyber-ease),
    transform var(--cyber-ease);
}

.metric-item:hover .metric-icon-shell {
  transform: translateY(-1px) scale(1.02);
  border-color: rgba(117, 241, 255, 0.52);
  background:
    radial-gradient(circle at 35% 35%, rgba(117, 241, 255, 0.36), transparent 54%),
    linear-gradient(135deg, rgba(117, 241, 255, 0.24), rgba(255, 73, 179, 0.18)),
    rgba(8, 24, 52, 0.96);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.24),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    0 0 22px rgba(117, 241, 255, 0.18),
    0 0 36px rgba(255, 73, 179, 0.08);
}

.metric-item:hover .metric-icon {
  opacity: 1;
  transform: scale(1.04);
  filter:
    drop-shadow(0 0 8px rgba(117, 241, 255, 0.58))
    drop-shadow(0 0 18px rgba(117, 241, 255, 0.22))
    brightness(1.24)
    saturate(1)
    contrast(1.08);
}

.metric-label {
  position: relative;
  z-index: 1;
  color: rgba(154, 199, 230, 0.56);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.08);
}

.metric-value {
  position: relative;
  z-index: 1;
  align-self: end;
  color: #f7feff;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums lining-nums;
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.16),
    0 0 22px rgba(117, 241, 255, 0.08);
}

.metric-item:hover .metric-label {
  color: rgba(176, 224, 255, 0.68);
}

.metric-item:hover .metric-value {
  color: #fbffff;
  text-shadow:
    0 0 12px rgba(117, 241, 255, 0.22),
    0 0 28px rgba(117, 241, 255, 0.1);
}

.state-card {
  padding: 24px;
  color: rgba(218, 242, 255, 0.82);
}

.state-card--error {
  color: rgba(255, 172, 212, 0.88);
  border-color: rgba(255, 110, 180, 0.3);
  box-shadow:
    inset 0 0 18px rgba(255, 82, 185, 0.08),
    0 18px 36px rgba(0, 0, 0, 0.22);
}

@media (max-width: 1080px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .panel-shell {
    padding: 18px;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-main {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .sun-cycle {
    grid-template-columns: 1fr;
  }

  .sun-divider {
    width: 100%;
    height: 1px;
  }
}

@media (max-width: 520px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .hero-top {
    grid-template-columns: 1fr;
  }

  .arrow-button {
    justify-self: center;
  }
}
</style>
