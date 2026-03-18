<script setup lang="ts">
const forecasts = [
  { day: '昨天', high: '19°', low: '11°', icon: '🌧️' },
  { day: '今天', high: '11°', low: '9°', icon: '🌙☁️' },
  { day: '周四', high: '14°', low: '11°', icon: '⛅' },
  { day: '周五', high: '13°', low: '10°', icon: '🌧️' },
  { day: '周六', high: '17°', low: '12°', icon: '🌤️' },
  { day: '周日', high: '18°', low: '13°', icon: '🌧️' },
]
</script>

<template>
  <section class="hourly">
    <header class="head">
      <h2>每小时预报</h2>
      <div class="chips">
        <span class="chip active">概览</span>
        <span class="chip">降水</span>
        <span class="chip">风速</span>
        <span class="chip">湿度</span>
      </div>
    </header>

    <div class="cards">
      <article v-for="item in forecasts" :key="item.day" class="card">
        <p>{{ item.day }}</p>
        <p class="emoji">{{ item.icon }}</p>
        <p class="temp">{{ item.high }}</p>
        <p class="low">{{ item.low }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.hourly {
  margin-top: 26px;
}

.head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

h2 {
  font-size: 32px;
  font-weight: 700;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  border-radius: 999px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #c8d4ff;
}

.chip.active {
  background: #ffc939;
  color: #202746;
}

.cards {
  margin-top: 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.card {
  border-radius: 14px;
  padding: 12px;
  background: #213a69;
  text-align: center;
}

.emoji {
  margin: 10px 0;
  font-size: 32px;
}

.temp {
  font-size: 26px;
  font-weight: 700;
}

.low {
  color: #9cb2eb;
}
</style>
