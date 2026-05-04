<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { WeatherHourlyItem } from '@/service/weather'

type ChartMode = 'both' | 'line' | 'bar'
type IntervalOption = '30m' | '1h' | '2h'

const props = withDefaults(
  defineProps<{
    cityName?: string
    temperature?: string
    hourlyItems?: WeatherHourlyItem[]
    compact?: boolean
    showIntervalSelector?: boolean
  }>(),
  {
    cityName: '默认城市',
    temperature: '18°C',
    compact: false,
    showIntervalSelector: false,
  },
)

const chartMode = ref<ChartMode>('both')
const interval = ref<IntervalOption>('1h')
const chartRef = ref<HTMLDivElement | null>(null)

let chartInstance: echarts.ECharts | null = null

const intervalOptions: ReadonlyArray<{
  value: IntervalOption
  label: string
}> = [
  { value: '30m', label: '30分钟' },
  { value: '1h', label: '1小时' },
  { value: '2h', label: '2小时' },
]

const parseTemperature = (value?: string) => {
  const parsed = Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) ? parsed : null
}

const trendHours = computed(() => {
  const hourStep = interval.value === '30m' ? 0.5 : interval.value === '1h' ? 1 : 2
  const points: string[] = []

  for (let hour = 0; hour < 24; hour += hourStep) {
    const wholeHour = Math.floor(hour)
    const minutes = hour % 1 === 0 ? '00' : '30'
    points.push(`${String(wholeHour).padStart(2, '0')}:${minutes}`)
  }

  return points
})

const trendValues = computed(() => {
  const sourceValues = props.hourlyItems
    ?.slice(0, 24)
    .map((item) => parseTemperature(item.temperature))
    .filter((value): value is number => value !== null) ?? []

  if (!sourceValues.length) {
    const fallback = parseTemperature(props.temperature) ?? 18
    return trendHours.value.map(() => fallback)
  }

  if (interval.value === '1h') {
    return sourceValues.slice(0, 24)
  }

  if (interval.value === '2h') {
    return sourceValues.filter((_, index) => index % 2 === 0)
  }

  return trendHours.value.map((_, index) => {
    const sourceIndex = index / 2
    const leftIndex = Math.floor(sourceIndex)
    const rightIndex = Math.min(leftIndex + 1, sourceValues.length - 1)
    const left = sourceValues[leftIndex] ?? sourceValues[0] ?? 0
    const right = sourceValues[rightIndex] ?? left
    const progress = sourceIndex - leftIndex
    return Number((left + (right - left) * progress).toFixed(1))
  })
})

const activeSeries = computed(() => {
  if (chartMode.value === 'line') {
    return ['line']
  }

  if (chartMode.value === 'bar') {
    return ['bar']
  }

  return ['bar', 'line']
})

const syncChart = () => {
  if (!chartInstance) {
    return
  }

  const showBar = activeSeries.value.includes('bar')
  const showLine = activeSeries.value.includes('line')
  const hasCompactControls = props.compact && props.showIntervalSelector
  const topPadding = props.compact
    ? hasCompactControls
      ? 92
      : 32
    : 72

  chartInstance.setOption({
    backgroundColor: 'transparent',
    animationDuration: 640,
    animationEasing: 'cubicOut',
    grid: {
      left: 42,
      right: 22,
      top: topPadding,
      bottom: 36,
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
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(0, 214, 255, 0.08)',
        },
      },
    },
    legend: props.compact
      ? undefined
      : {
          top: 20,
          right: 20,
          itemWidth: 12,
          itemHeight: 12,
          textStyle: {
            color: 'rgba(214, 244, 255, 0.78)',
          },
          data: [
            { name: '温度柱状', icon: 'roundRect' },
            { name: '温度折线', icon: 'circle' },
          ],
          selected: {
            温度柱状: showBar,
            温度折线: showLine,
          },
        },
    xAxis: {
      type: 'category',
      data: trendHours.value,
      boundaryGap: true,
      axisLine: {
        lineStyle: {
          color: 'rgba(117, 241, 255, 0.22)',
        },
      },
      axisLabel: {
        color: 'rgba(198, 235, 247, 0.78)',
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
        name: '温度柱状',
        type: 'bar',
        barMaxWidth: 26,
        data: trendValues.value,
        itemStyle: {
          borderRadius: [10, 10, 4, 4],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(90, 224, 255, 0.94)' },
            { offset: 0.55, color: 'rgba(35, 157, 255, 0.68)' },
            { offset: 1, color: 'rgba(141, 94, 255, 0.28)' },
          ]),
          shadowBlur: 18,
          shadowColor: 'rgba(40, 191, 255, 0.3)',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 24,
            shadowColor: 'rgba(117, 241, 255, 0.44)',
          },
        },
      },
      {
        name: '温度折线',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        data: trendValues.value,
        lineStyle: {
          width: 3,
          color: '#f2fbff',
          shadowBlur: 16,
          shadowColor: 'rgba(117, 241, 255, 0.42)',
        },
        itemStyle: {
          color: '#f7fdff',
          borderColor: '#4edfff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(117, 241, 255, 0.46)',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(198, 246, 255, 0.26)' },
            { offset: 0.5, color: 'rgba(66, 176, 255, 0.16)' },
            { offset: 1, color: 'rgba(117, 77, 255, 0.02)' },
          ]),
        },
      },
    ],
  })
}

const mountChart = async () => {
  await nextTick()
  if (!chartRef.value) {
    return
  }

  chartInstance?.dispose()
  chartInstance = echarts.init(chartRef.value)
  syncChart()
}

const resizeChart = () => {
  chartInstance?.resize()
}

onMounted(async () => {
  await mountChart()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
  chartInstance = null
})

watch([
  () => props.cityName,
  () => props.temperature,
  () => props.hourlyItems,
  trendValues,
  chartMode,
  interval,
  () => props.compact,
  () => props.showIntervalSelector,
], () => {
  syncChart()
})
</script>

<template>
  <section class="trend-shell" :class="{ 'trend-shell--compact': props.compact }">
    <header v-if="!props.compact" class="trend-head">
      <div>
        <p class="trend-kicker">THERMAL VECTOR FIELD</p>
        <h2>{{ props.cityName }} 温度轨迹</h2>
        <p class="trend-note">基于当前城市实时温度生成的日内波动趋势，支持柱状与折线叠加观察。</p>
      </div>

      <div class="trend-actions">
        <label
          v-if="props.showIntervalSelector"
          class="interval-select-shell"
          data-testid="temperature-trend-interval-shell"
        >
          <span class="interval-label">采样间隔</span>
          <select
            v-model="interval"
            class="interval-select"
            aria-label="温度轨迹时间间隔"
            data-testid="temperature-trend-interval-select"
          >
            <option
              v-for="item in intervalOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </label>

        <div class="mode-switch" role="tablist" aria-label="图表模式">
          <button
            type="button"
            class="mode-btn"
            :class="{ 'is-active': chartMode === 'bar' }"
            @click="chartMode = 'bar'"
          >
            柱状图
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ 'is-active': chartMode === 'line' }"
            @click="chartMode = 'line'"
          >
            折线图
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ 'is-active': chartMode === 'both' }"
            @click="chartMode = 'both'"
          >
            同时显示
          </button>
        </div>
      </div>
    </header>

    <section class="chart-card" :class="{ 'chart-card--compact': props.compact }">
      <div
        v-if="props.compact && props.showIntervalSelector"
        class="compact-toolbar"
        data-testid="temperature-trend-interval-shell"
      >
        <label class="interval-select-shell interval-select-shell--compact">
          <span class="interval-label">采样间隔</span>
          <select
            v-model="interval"
            class="interval-select"
            aria-label="温度轨迹时间间隔"
            data-testid="temperature-trend-interval-select"
          >
            <option
              v-for="item in intervalOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </label>
      </div>

      <div class="chart-grid" aria-hidden="true" />
      <div ref="chartRef" class="chart-surface" data-testid="temperature-trend-chart" />
    </section>
  </section>
</template>

<style scoped>
.trend-shell {
  display: grid;
  gap: 18px;
  margin-top: 10px;
}

.trend-shell--compact {
  margin-top: 0;
  gap: 0;
}

.trend-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.trend-kicker {
  margin: 0 0 8px;
  color: rgba(117, 241, 255, 0.72);
  letter-spacing: 0.28em;
  font-size: 11px;
}

.trend-head h2 {
  margin: 0;
  font-size: 30px;
  color: #edfbff;
  text-shadow:
    0 0 12px rgba(117, 241, 255, 0.42),
    0 0 22px rgba(82, 129, 255, 0.14);
}

.trend-note {
  margin: 10px 0 0;
  color: rgba(210, 241, 255, 0.72);
  max-width: 540px;
  line-height: 1.7;
}

.trend-actions {
  display: grid;
  gap: 12px;
  justify-items: end;
}

.interval-select-shell {
  display: inline-grid;
  gap: 8px;
  justify-items: start;
}

.interval-select-shell--compact {
  width: min(220px, 100%);
}

.interval-label {
  color: rgba(160, 231, 255, 0.76);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.interval-select {
  min-width: 156px;
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
  transition:
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    transform var(--cyber-ease);
}

.interval-select:hover,
.interval-select:focus {
  border-color: rgba(148, 245, 255, 0.62);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.14),
    0 0 18px rgba(117, 241, 255, 0.18);
  transform: translateY(-1px);
}

.mode-btn {
  border: 1px solid rgba(117, 241, 255, 0.24);
  color: rgba(216, 246, 255, 0.8);
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.08), rgba(117, 241, 255, 0)),
    rgba(4, 17, 42, 0.84);
  transition:
    border-color var(--cyber-ease),
    color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    transform var(--cyber-ease);
}

.mode-btn:hover {
  border-color: rgba(117, 241, 255, 0.5);
  color: #f1fcff;
  box-shadow: 0 0 12px rgba(117, 241, 255, 0.18);
  transform: translateY(-1px);
}

.mode-switch {
  display: inline-grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 6px;
  border-radius: 18px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  background:
    linear-gradient(135deg, rgba(0, 214, 255, 0.08), rgba(255, 0, 153, 0.05)),
    rgba(3, 13, 32, 0.86);
  box-shadow:
    inset 0 0 20px rgba(117, 241, 255, 0.08),
    0 16px 40px rgba(0, 0, 0, 0.22);
}

.mode-btn {
  min-width: 112px;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
}

.mode-btn.is-active {
  color: #f4feff;
  border-color: rgba(148, 245, 255, 0.62);
  background:
    linear-gradient(135deg, rgba(88, 225, 255, 0.24), rgba(125, 84, 255, 0.18)),
    rgba(6, 26, 58, 0.94);
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.16),
    0 0 18px rgba(117, 241, 255, 0.16);
}

.chart-card {
  position: relative;
  min-height: 460px;
  border-radius: 26px;
  overflow: hidden;
  border: 1px solid rgba(117, 241, 255, 0.22);
  background:
    radial-gradient(circle at top left, rgba(96, 224, 255, 0.08), transparent 32%),
    radial-gradient(circle at bottom right, rgba(145, 88, 255, 0.1), transparent 36%),
    linear-gradient(160deg, rgba(5, 18, 42, 0.96), rgba(3, 10, 24, 0.94));
  box-shadow:
    inset 0 1px 0 rgba(205, 251, 255, 0.08),
    inset 0 0 30px rgba(117, 241, 255, 0.08),
    0 20px 48px rgba(0, 0, 0, 0.24);
}

.chart-card--compact {
  min-height: 360px;
  border-radius: 20px;
}

.compact-toolbar {
  position: absolute;
  top: 18px;
  left: 20px;
  right: 20px;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
}

.compact-toolbar > * {
  pointer-events: auto;
}

.chart-grid,
.chart-surface {
  position: absolute;
  inset: 0;
}

.trend-summary {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 18px;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 8px;
  pointer-events: none;
}

.trend-summary__item {
  display: grid;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(117, 241, 255, 0.16);
  background: rgba(3, 13, 32, 0.62);
  box-shadow: inset 0 0 12px rgba(117, 241, 255, 0.06);
}

.trend-summary__item span {
  color: rgba(160, 231, 255, 0.7);
  font-size: 11px;
}

.trend-summary__item strong {
  color: rgba(241, 253, 255, 0.94);
  font-size: 13px;
}

.chart-grid {
  background-image:
    linear-gradient(rgba(117, 241, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(117, 241, 255, 0.04) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.86), transparent 100%);
}

.chart-surface {
  min-height: 460px;
}

.chart-card--compact .chart-surface {
  min-height: 360px;
}

@media (max-width: 860px) {
  .trend-actions {
    justify-items: stretch;
    width: 100%;
  }

  .interval-select-shell {
    width: 100%;
  }

  .interval-select {
    width: 100%;
  }

  .mode-switch {
    width: 100%;
  }

  .mode-btn {
    min-width: 0;
  }

  .compact-toolbar {
    left: 16px;
    right: 16px;
    justify-content: stretch;
  }
}
</style>
