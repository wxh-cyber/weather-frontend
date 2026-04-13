<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    cityName?: string
    weatherText?: string
  }>(),
  {
    cityName: '默认城市',
    weatherText: '多云',
  },
)

const note = computed(() => {
  if (props.weatherText.includes('雨')) return `${props.cityName}未来 2 小时存在短时降水波动，请关注雷达回波。`
  if (props.weatherText.includes('雪')) return `${props.cityName}上空云层较厚，短时可能出现降雪增强。`
  if (props.weatherText.includes('晴')) return `${props.cityName}当前云层较少，至少 2 小时内无明显降水信号。`
  return `${props.cityName}云层活动平稳，至少 2 小时内无强降水信号。`
})
</script>

<template>
  <article class="panel">
    <h3>{{ props.cityName }}降水地图</h3>
    <div class="map">
      <div class="dot" />
    </div>
    <p class="note">{{ note }}</p>
  </article>
</template>

<style scoped>
.panel {
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background: linear-gradient(160deg, rgba(16, 40, 78, 0.86), rgba(8, 24, 52, 0.84));
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.08),
    var(--cyber-glow-sm);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
}

h3 {
  margin-bottom: 12px;
  color: var(--cyber-cyan);
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.45);
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.map {
  height: 220px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 55% 52%, #ffd35a 0 7px, transparent 8px),
    radial-gradient(circle at 20% 18%, rgba(0, 255, 255, 0.2), transparent 36%),
    linear-gradient(135deg, #5d86a8 0%, #355783 35%, #1a2f4f 100%);
  border: 1px solid rgba(117, 241, 255, 0.28);
  position: relative;
  overflow: hidden;
}

.map::before,
.map::after {
  content: '';
  position: absolute;
  width: 180%;
  height: 2px;
  background: rgba(60, 107, 130, 0.25);
  left: -40%;
}

.map::before {
  top: 40%;
  transform: rotate(-9deg);
}

.map::after {
  top: 62%;
  transform: rotate(6deg);
}

.dot {
  position: absolute;
  left: 54%;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(255, 227, 163, 0.7);
  background: rgba(255, 211, 90, 0.8);
  box-shadow:
    0 0 12px rgba(255, 213, 90, 0.6),
    0 0 24px rgba(117, 241, 255, 0.18);
}

.note {
  margin-top: 12px;
  color: var(--cyber-text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  h3 {
    animation: none;
  }
}
</style>
