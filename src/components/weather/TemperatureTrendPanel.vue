<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

type ChartMode = 'both' | 'line' | 'bar'

const props = withDefaults(
  defineProps<{
    cityName?: string
    temperature?: string
    compact?: boolean
  }>(),
  {
    cityName: '默认城市',
    temperature: '18°C',
    compact: false,
  },
)

const chartMode = ref<ChartMode>('both')
const chartRef = ref<HTMLDivElement | null>(null)

let chartInstance: echarts.ECharts | null = null

const baseTemp = computed(() => {
  const value = Number.parseInt(props.temperature, 10)
  return Number.isNaN(value) ? 18 : value
})

const trendHours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
const trendValues = computed(() => {
  const citySeed = Array.from(props.cityName).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return trendHours.map((_, index) => {
    const wave = Math.sin((index / trendHours.length) * Math.PI * 2) * 3.2
    const offset = ((citySeed + index * 7) % 5) - 2
    return Number((baseTemp.value + wave + offset * 0.35).toFixed(1))
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

  chartInstance.setOption({
    backgroundColor: 'transparent',
    animationDuration: 640,
    animationEasing: 'cubicOut',
    grid: {
      left: 42,
      right: 22,
      top: props.compact ? 32 : 72,
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
      data: trendHours,
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

watch([() => props.cityName, () => props.temperature, trendValues, chartMode, () => props.compact], () => {
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

.chart-card--compact .chart-surface {
  min-height: 360px;
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
}
</style>
