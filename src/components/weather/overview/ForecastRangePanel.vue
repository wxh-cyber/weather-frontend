<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { getWeatherIcon, type WeatherIconKey } from '@/utils/weather/weatherIconMap'

type RangeOption = '7d' | '15d' | '90d'

type DailyForecastItem = {
  id: string
  date: Date
  monthLabel: string
  dateLabel: string
  relationLabel: string
  weekdayLabel: string
  iconKey: WeatherIconKey
  high: number
  low: number
}

type TenDayBucket = {
  id: string
  label: string
  high: number
  low: number
  days: DailyForecastItem[]
}

const props = withDefaults(
  defineProps<{
    cityName?: string
    temperature?: string
  }>(),
  {
    cityName: '默认城市',
    temperature: '18°C',
  },
)

const emit = defineEmits<{
  'range-change': [rangeMode: RangeOption]
}>()

const rangeMode = ref<RangeOption>('7d')
const activeBucketId = ref('')
const chartRef = ref<HTMLDivElement | null>(null)

let chartInstance: echarts.ECharts | null = null

const rangeOptions: ReadonlyArray<{
  value: RangeOption
  label: string
}> = [
  { value: '7d', label: '7日' },
  { value: '15d', label: '15日' },
  { value: '90d', label: '90日' },
]

const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const baseTemp = computed(() => {
  const value = Number.parseInt(props.temperature, 10)
  return Number.isNaN(value) ? 18 : value
})

const citySeed = computed(() => Array.from(props.cityName).reduce((sum, char) => sum + char.charCodeAt(0), 0))

const resolveRelationLabel = (offset: number, date: Date) => {
  if (offset === -1) return '昨天'
  if (offset === 0) return '今天'
  if (offset === 1) return '明天'
  return weekdayLabels[date.getDay()] ?? '周一'
}

const resolveIconKey = (offset: number): WeatherIconKey => {
  const pattern = (citySeed.value + offset * 5) % 6
  if (pattern === 0) return 'sunny'
  if (pattern === 1) return 'partly-cloudy'
  if (pattern === 2) return 'cloudy'
  if (pattern === 3) return 'rainy'
  if (pattern === 4) return 'night-cloudy'
  return 'sunny'
}

const allForecastDays = computed<DailyForecastItem[]>(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 90 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)

    const seasonalWave = Math.sin((index / 90) * Math.PI * 2.4) * 5.1
    const shortWave = Math.cos((index / 9) * Math.PI * 1.8) * 1.6
    const average = baseTemp.value + seasonalWave + shortWave + ((citySeed.value + index * 13) % 4) - 1.5
    const high = Number((average + 4.2 + ((citySeed.value + index * 3) % 3) * 0.6).toFixed(1))
    const low = Number((average - 4.8 - ((citySeed.value + index * 7) % 3) * 0.5).toFixed(1))

    return {
      id: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      date,
      monthLabel: `${date.getMonth() + 1}月`,
      dateLabel: `${date.getDate()}日`,
      relationLabel: resolveRelationLabel(index, date),
      weekdayLabel: weekdayLabels[date.getDay()] ?? '周一',
      iconKey: resolveIconKey(index),
      high,
      low,
    }
  })
})

const visibleForecastDays = computed(() => {
  if (rangeMode.value === '7d') {
    return allForecastDays.value.slice(0, 7)
  }

  if (rangeMode.value === '15d') {
    return allForecastDays.value.slice(0, 15)
  }

  const activeBucket = tenDayBuckets.value.find((bucket) => bucket.id === activeBucketId.value)
  return activeBucket?.days ?? []
})

const tenDayBuckets = computed<TenDayBucket[]>(() => {
  const buckets = new Map<string, TenDayBucket>()

  for (const item of allForecastDays.value) {
    const dayOfMonth = item.date.getDate()
    const segment = dayOfMonth <= 10 ? '上旬' : dayOfMonth <= 20 ? '中旬' : '下旬'
    const key = `${item.date.getFullYear()}-${item.date.getMonth() + 1}-${segment}`
    const label = `${item.date.getMonth() + 1}月${segment}`
    const bucket = buckets.get(key)

    if (!bucket) {
      buckets.set(key, {
        id: key,
        label,
        high: item.high,
        low: item.low,
        days: [item],
      })
      continue
    }

    bucket.days.push(item)
    bucket.high = Math.max(bucket.high, item.high)
    bucket.low = Math.min(bucket.low, item.low)
  }

  return Array.from(buckets.values()).map((bucket) => ({
    ...bucket,
    high: Number(bucket.high.toFixed(1)),
    low: Number(bucket.low.toFixed(1)),
  }))
})

const activeBucketIndex = computed(() => {
  const index = tenDayBuckets.value.findIndex((bucket) => bucket.id === activeBucketId.value)
  return index < 0 ? 0 : index
})

const syncActiveBucket = () => {
  if (rangeMode.value !== '90d') {
    return
  }

  const hasActiveBucket = tenDayBuckets.value.some((bucket) => bucket.id === activeBucketId.value)
  if (!hasActiveBucket) {
    activeBucketId.value = tenDayBuckets.value[0]?.id ?? ''
  }
}

const syncChart = () => {
  if (!chartInstance || rangeMode.value !== '90d') {
    return
  }

  const activeIndex = activeBucketIndex.value

  chartInstance.setOption({
    backgroundColor: 'transparent',
    animationDuration: 700,
    animationEasing: 'cubicOut',
    grid: {
      left: 40,
      right: 22,
      top: 32,
      bottom: 34,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 16, 38, 0.94)',
      borderColor: 'rgba(117, 241, 255, 0.34)',
      borderWidth: 1,
      textStyle: {
        color: '#ecfbff',
      },
      formatter: (params: Array<{ axisValue: string; seriesName: string; data: number }>) => {
        const title = params[0]?.axisValue ?? ''
        const rows = params.map((item) => `${item.seriesName}：${item.data}°C`).join('<br/>')
        return `${title}<br/>${rows}`
      },
    },
    xAxis: {
      type: 'category',
      data: tenDayBuckets.value.map((bucket) => bucket.label),
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: 'rgba(117, 241, 255, 0.22)',
        },
      },
      axisLabel: {
        color: 'rgba(198, 235, 247, 0.76)',
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      name: '°C',
      nameTextStyle: {
        color: 'rgba(147, 227, 255, 0.7)',
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(117, 241, 255, 0.08)',
          type: 'dashed',
        },
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: 'rgba(198, 235, 247, 0.7)',
      },
    },
    series: [
      {
        name: '最高气温',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        data: tenDayBuckets.value.map((bucket, index) => ({
          value: bucket.high,
          itemStyle: index === activeIndex
            ? {
                color: '#ffe2bf',
                borderColor: '#ffb76a',
                borderWidth: 3,
                shadowBlur: 18,
                shadowColor: 'rgba(255, 183, 106, 0.48)',
              }
            : undefined,
        })),
        lineStyle: {
          width: 3,
          color: '#ffb76a',
          shadowBlur: 16,
          shadowColor: 'rgba(255, 183, 106, 0.32)',
        },
        itemStyle: {
          color: '#ffd1a3',
          borderColor: '#ff9f43',
          borderWidth: 2,
        },
      },
      {
        name: '最低气温',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        data: tenDayBuckets.value.map((bucket, index) => ({
          value: bucket.low,
          itemStyle: index === activeIndex
            ? {
                color: '#f2fdff',
                borderColor: '#43c9ff',
                borderWidth: 3,
                shadowBlur: 18,
                shadowColor: 'rgba(117, 241, 255, 0.48)',
              }
            : undefined,
        })),
        lineStyle: {
          width: 3,
          color: '#9de9ff',
          shadowBlur: 16,
          shadowColor: 'rgba(117, 241, 255, 0.32)',
        },
        itemStyle: {
          color: '#eefcff',
          borderColor: '#43c9ff',
          borderWidth: 2,
        },
      },
    ],
  })
}

const mountChart = async () => {
  await nextTick()
  if (!chartRef.value || rangeMode.value !== '90d') {
    return
  }

  chartInstance?.dispose()
  chartInstance = echarts.init(chartRef.value)
  syncChart()
}

const disposeChart = () => {
  chartInstance?.dispose()
  chartInstance = null
}

const resizeChart = () => {
  chartInstance?.resize()
}

const handleBucketSelect = (bucketId: string) => {
  activeBucketId.value = bucketId
}

watch(
  rangeMode,
  async (nextMode) => {
    emit('range-change', nextMode)

    if (nextMode === '90d') {
      syncActiveBucket()
      await mountChart()
      return
    }

    disposeChart()
  },
  { immediate: true },
)

watch([tenDayBuckets, activeBucketId], () => {
  syncActiveBucket()
  syncChart()
})

watch([() => props.cityName, () => props.temperature], async () => {
  if (rangeMode.value === '90d') {
    syncActiveBucket()
    await mountChart()
  }
})

onMounted(async () => {
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  disposeChart()
})
</script>

<template>
  <section class="forecast-panel">
    <header class="forecast-head">
      <div>
        <p class="forecast-kicker">CLIMATE RANGE TERMINAL</p>
        <h3>分段天气列表</h3>
        <p class="forecast-note">切换不同时间窗口后，列表与气温节点会同步刷新，维持统一的赛博观测界面。</p>
      </div>

      <label class="range-select-shell">
        <span class="range-label">时间范围</span>
        <select
          v-model="rangeMode"
          class="range-select"
          aria-label="天气时间范围"
          data-testid="forecast-range-select"
        >
          <option
            v-for="item in rangeOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </option>
        </select>
      </label>
    </header>

    <section
      v-if="rangeMode === '90d'"
      class="seasonal-shell"
      data-testid="forecast-range-90d"
    >
      <div class="bucket-track" data-testid="forecast-bucket-track">
        <button
          v-for="bucket in tenDayBuckets"
          :key="bucket.id"
          type="button"
          class="bucket-chip"
          :class="{ 'is-active': bucket.id === activeBucketId }"
          @click="handleBucketSelect(bucket.id)"
        >
          {{ bucket.label }}
        </button>
      </div>

      <section class="bucket-chart-card">
        <div class="bucket-chart-grid" aria-hidden="true" />
        <div
          ref="chartRef"
          class="bucket-chart"
          data-testid="forecast-bucket-chart"
        />
      </section>
    </section>

    <section
      class="forecast-list"
      :data-testid="rangeMode === '90d' ? 'forecast-day-list-90d' : 'forecast-day-list'"
    >
      <article
        v-for="item in visibleForecastDays"
        :key="item.id"
        class="forecast-row"
      >
        <div class="forecast-date">
          <span class="forecast-month">{{ item.monthLabel }}</span>
          <strong class="forecast-day">{{ item.dateLabel }}</strong>
          <span class="forecast-relation">{{ item.relationLabel }}</span>
        </div>

        <div class="forecast-icon">
          <img
            :src="getWeatherIcon(item.iconKey).src"
            :alt="getWeatherIcon(item.iconKey).alt"
          />
        </div>

        <div class="forecast-temp">
          <span class="forecast-temp-high">{{ item.high.toFixed(1) }}°</span>
          <span class="forecast-temp-divider">/</span>
          <span class="forecast-temp-low">{{ item.low.toFixed(1) }}°</span>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.forecast-panel {
  display: grid;
  gap: 18px;
  margin-top: 6px;
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  background:
    radial-gradient(circle at top right, rgba(117, 241, 255, 0.08), transparent 28%),
    linear-gradient(150deg, rgba(7, 22, 52, 0.92), rgba(3, 11, 28, 0.96));
  box-shadow:
    inset 0 1px 0 rgba(205, 251, 255, 0.08),
    inset 0 0 24px rgba(117, 241, 255, 0.08),
    0 18px 42px rgba(0, 0, 0, 0.22);
}

.forecast-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.forecast-kicker {
  margin: 0 0 8px;
  color: rgba(117, 241, 255, 0.72);
  letter-spacing: 0.28em;
  font-size: 11px;
}

.forecast-head h3 {
  margin: 0;
  font-size: 28px;
  color: #effcff;
  text-shadow:
    0 0 12px rgba(117, 241, 255, 0.32),
    0 0 20px rgba(82, 129, 255, 0.12);
}

.forecast-note {
  margin: 10px 0 0;
  color: rgba(208, 240, 255, 0.72);
  max-width: 560px;
  line-height: 1.7;
}

.range-select-shell {
  display: inline-grid;
  gap: 8px;
}

.range-label {
  color: rgba(160, 231, 255, 0.76);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.range-select {
  min-width: 124px;
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

.seasonal-shell {
  display: grid;
  gap: 16px;
}

.bucket-track {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.bucket-track::-webkit-scrollbar {
  display: none;
}

.bucket-chip {
  flex: 0 0 auto;
  min-width: 96px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(117, 241, 255, 0.24);
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

.bucket-chip:hover {
  color: #f4feff;
  border-color: rgba(117, 241, 255, 0.42);
  transform: translateY(-1px);
  box-shadow: 0 0 14px rgba(117, 241, 255, 0.14);
}

.bucket-chip.is-active {
  background:
    linear-gradient(135deg, rgba(85, 230, 255, 0.26), rgba(128, 84, 255, 0.18)),
    rgba(7, 28, 62, 0.92);
  border-color: rgba(148, 245, 255, 0.62);
  color: #f4feff;
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.18),
    0 0 18px rgba(117, 241, 255, 0.16);
}

.bucket-chart-card {
  position: relative;
  min-height: 300px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(117, 241, 255, 0.18);
  background:
    linear-gradient(160deg, rgba(5, 18, 42, 0.94), rgba(3, 10, 24, 0.92));
}

.bucket-chart-grid,
.bucket-chart {
  position: absolute;
  inset: 0;
}

.bucket-chart-grid {
  background-image:
    linear-gradient(rgba(117, 241, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(117, 241, 255, 0.04) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.86), transparent 100%);
}

.bucket-chart {
  min-height: 300px;
}

.forecast-list {
  display: grid;
  gap: 10px;
}

.forecast-row {
  display: grid;
  grid-template-columns: minmax(0, 160px) 72px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  background:
    linear-gradient(140deg, rgba(9, 26, 58, 0.74), rgba(4, 14, 32, 0.82));
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.06),
    0 12px 24px rgba(0, 0, 0, 0.16);
}

.forecast-date {
  display: grid;
  gap: 4px;
}

.forecast-month,
.forecast-relation {
  color: rgba(182, 227, 242, 0.68);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.forecast-day {
  color: #f3fdff;
  font-size: 20px;
}

.forecast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.forecast-icon img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(117, 241, 255, 0.52));
}

.forecast-temp {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
}

.forecast-temp-high {
  color: #ffbe7a;
  text-shadow: 0 0 10px rgba(255, 183, 106, 0.22);
}

.forecast-temp-divider {
  color: rgba(196, 241, 255, 0.36);
}

.forecast-temp-low {
  color: #8fe8ff;
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.22);
}

@media (max-width: 760px) {
  .forecast-row {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .forecast-temp {
    justify-self: start;
  }
}
</style>
