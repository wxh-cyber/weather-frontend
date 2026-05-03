<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import ForecastRangePanel from '@/components/weather/overview/ForecastRangePanel.vue'

type ChartMode = 'both' | 'line' | 'bar'
type SeriesKey = 'average' | 'high' | 'low'
type ForecastRangeMode = '7d' | '15d' | '90d'

type DailyTrendItem = {
  day: string
  high: number
  low: number
  average: number
}

type LegendItem = {
  key: SeriesKey
  name: string
  icon: 'bar' | 'line'
  colorClass: string
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

const chartMode = ref<ChartMode>('both')
const forecastRangeMode = ref<Extract<ForecastRangeMode, '7d' | '15d'>>('7d')
const chartRef = ref<HTMLDivElement | null>(null)

let chartInstance: echarts.ECharts | null = null

const baseTemp = computed(() => {
  const value = Number.parseInt(props.temperature, 10)
  return Number.isNaN(value) ? 18 : value
})

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const legendItems: ReadonlyArray<LegendItem> = [
  {
    key: 'average',
    name: '平均气温',
    icon: 'bar',
    colorClass: 'trend-legend__swatch--average',
  },
  {
    key: 'high',
    name: '最高气温',
    icon: 'line',
    colorClass: 'trend-legend__swatch--high',
  },
  {
    key: 'low',
    name: '最低气温',
    icon: 'line',
    colorClass: 'trend-legend__swatch--low',
  },
]

const allTrendDays = computed<DailyTrendItem[]>(() => {
  const citySeed = Array.from(props.cityName).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 15 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    const day = weekDays[date.getDay()] ?? '周一'
    const wave = Math.sin((index / 15) * Math.PI * 2) * 2.8
    const offset = ((citySeed + index * 11) % 5) - 2
    const average = Number((baseTemp.value + wave + offset * 0.4).toFixed(1))
    const high = Number((average + 4 + ((citySeed + index * 3) % 2) * 0.7).toFixed(1))
    const low = Number((average - 5 - ((citySeed + index * 5) % 2) * 0.6).toFixed(1))

    return {
      day,
      high,
      low,
      average,
    }
  })
})

const visibleTrendDays = computed(() =>
  forecastRangeMode.value === '15d' ? allTrendDays.value.slice(0, 15) : allTrendDays.value.slice(0, 7),
)

const activeSeries = computed(() => {
  if (chartMode.value === 'line') {
    return ['high', 'low'] satisfies SeriesKey[]
  }

  if (chartMode.value === 'bar') {
    return ['average'] satisfies SeriesKey[]
  }

  return ['average', 'high', 'low'] satisfies SeriesKey[]
})

const activeLegendItems = computed(() =>
  legendItems.filter((item) => activeSeries.value.includes(item.key)),
)

const handleRangeChange = (nextRangeMode: ForecastRangeMode) => {
  if (nextRangeMode === '90d') {
    return
  }

  forecastRangeMode.value = nextRangeMode
}

const syncChart = () => {
  if (!chartInstance) {
    return
  }

  const showAverage = activeSeries.value.includes('average')
  const showHigh = activeSeries.value.includes('high')
  const showLow = activeSeries.value.includes('low')
  const series = [
    showAverage
      ? {
          name: '平均气温',
          type: 'bar',
          barMaxWidth: 30,
          data: visibleTrendDays.value.map((item) => item.average),
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
        }
      : null,
    showHigh
      ? {
          name: '最高气温',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 10,
          data: visibleTrendDays.value.map((item) => item.high),
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
            shadowBlur: 10,
            shadowColor: 'rgba(255, 183, 106, 0.36)',
          },
        }
      : null,
    showLow
      ? {
          name: '最低气温',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 10,
          data: visibleTrendDays.value.map((item) => item.low),
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
            shadowBlur: 10,
            shadowColor: 'rgba(117, 241, 255, 0.42)',
          },
        }
      : null,
  ].filter(Boolean)

  chartInstance.setOption({
    backgroundColor: 'transparent',
    animationDuration: 720,
    animationEasing: 'cubicOut',
    grid: {
      left: 44,
      right: 28,
      top: 80,
      bottom: 40,
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
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(0, 214, 255, 0.08)',
        },
      },
    },
    legend: {
      show: false,
    },
    xAxis: {
      type: 'category',
      data: visibleTrendDays.value.map((item) => item.day),
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
    series,
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

watch([() => props.cityName, () => props.temperature, visibleTrendDays, chartMode], () => {
  syncChart()
})
</script>

<template>
  <section class="trend-shell">
    <header class="trend-head">
      <div>
        <p class="trend-kicker">CLIMATE TREND ARC</p>
        <h2>{{ props.cityName }} 周温度趋势</h2>
        <p class="trend-note">将未来温度趋势中的高温、低温与平均气温整合到同一图层中，便于横向观察整体气温波动。</p>
      </div>

      <div class="trend-actions">
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

    <section class="chart-card">
      <div class="trend-legend" data-testid="weekly-temperature-trend-legend">
        <span class="trend-legend__title">图表案例</span>
        <div class="trend-legend__items">
          <div
            v-for="item in activeLegendItems"
            :key="item.key"
            class="trend-legend__item"
            :data-testid="`weekly-temperature-trend-legend-${item.key}`"
          >
            <span class="trend-legend__swatch" :class="[item.colorClass, `trend-legend__swatch--${item.icon}`]" />
            <span class="trend-legend__text">{{ item.name }}</span>
          </div>
        </div>
      </div>
      <div class="chart-grid" aria-hidden="true" />
      <div ref="chartRef" class="chart-surface" data-testid="weekly-temperature-trend-chart" />
    </section>

    <ForecastRangePanel
      :city-name="props.cityName"
      :temperature="props.temperature"
      @range-change="handleRangeChange"
    />
  </section>
</template>

<style scoped>
.trend-shell {
  display: grid;
  gap: 18px;
  margin-top: 10px;
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
  max-width: 560px;
  line-height: 1.7;
}

.trend-actions {
  display: grid;
  gap: 12px;
  justify-items: end;
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

.trend-legend {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
  display: grid;
  gap: 10px;
  width: 188px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(117, 241, 255, 0.22);
  background:
    linear-gradient(180deg, rgba(7, 17, 39, 0.94) 0%, rgba(3, 10, 26, 0.9) 100%);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.08),
    0 12px 28px rgba(0, 0, 0, 0.24);
}

.trend-legend__title {
  color: rgba(160, 231, 255, 0.76);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.trend-legend__items {
  display: grid;
  gap: 10px;
  min-height: 70px;
  align-content: start;
}

.trend-legend__item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 20px;
}

.trend-legend__swatch {
  position: relative;
  flex: 0 0 auto;
}

.trend-legend__swatch--bar {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.trend-legend__swatch--line {
  width: 18px;
  height: 12px;
}

.trend-legend__swatch--line::before,
.trend-legend__swatch--line::after {
  content: '';
  position: absolute;
}

.trend-legend__swatch--line::before {
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 999px;
  transform: translateY(-50%);
  background: currentColor;
  box-shadow: 0 0 10px currentColor;
}

.trend-legend__swatch--line::after {
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: #f7fdff;
  border: 2px solid currentColor;
  box-sizing: border-box;
  box-shadow: 0 0 12px currentColor;
}

.trend-legend__swatch--average {
  background: linear-gradient(180deg, rgba(90, 224, 255, 0.94), rgba(35, 157, 255, 0.68));
  box-shadow: 0 0 12px rgba(40, 191, 255, 0.28);
}

.trend-legend__swatch--high {
  color: #ffb76a;
}

.trend-legend__swatch--low {
  color: #9de9ff;
}

.trend-legend__text {
  color: rgba(214, 244, 255, 0.78);
  font-size: 13px;
  line-height: 1;
}

.chart-grid,
.chart-surface {
  position: absolute;
  inset: 0;
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

@media (max-width: 860px) {
  .trend-actions {
    justify-items: stretch;
    width: 100%;
  }

  .mode-switch {
    width: 100%;
  }

  .mode-btn {
    min-width: 0;
  }

  .trend-legend {
    left: 16px;
    right: 16px;
    top: 16px;
    width: auto;
  }
}
</style>
