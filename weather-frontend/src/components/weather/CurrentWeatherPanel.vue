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
  background: linear-gradient(160deg, #28467c 0%, #1e335f 100%);
}

.subtitle {
  color: #9fb4ee;
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
}

.desc {
  color: #c6d4ff;
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
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #b5c3ed;
}

.metric strong {
  color: #eff4ff;
}
</style>
