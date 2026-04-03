<script setup lang="ts">
const metrics = [
  { label: '空气质量', value: '27' },
  { label: '风速', value: '东北风 2级' },
  { label: '湿度', value: '80%' },
  { label: '能见度', value: '15.6 公里' },
  { label: '气压', value: '1015 hPa' },
  { label: '露点', value: '8°' },
]
</script>

<template>
  <article class="panel">
    <p class="subtitle">当前天气</p>
    <div class="temp-row">
      <span class="icon">🌙☁️</span>
      <div>
        <p class="temp">11°C</p>
        <p class="desc">多云 · 体感温度 9°</p>
      </div>
    </div>
    <p class="tips">今天部分地区多云。最低气温 9°。</p>
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

.subtitle {
  color: var(--cyber-text-muted);
}

.temp-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 12px 0;
}

.icon {
  font-size: 46px;
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
  .temp {
    animation: none;
  }
}
</style>
