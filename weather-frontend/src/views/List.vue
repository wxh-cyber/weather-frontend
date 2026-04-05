<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CityList from '@/components/List/CityList.vue'
import { useCityStore } from '@/store/city'

const cityStore = useCityStore()
const cityItems = computed(() => cityStore.cities)
const loading = computed(() => cityStore.loading)
const error = computed(() => cityStore.error)
const keyword = ref('')

const handleSearch = async () => {
  await cityStore.fetchCities(keyword.value)
}

onMounted(async () => {
  await cityStore.fetchCities('')
})
</script>

<template>
  <main class="list-page">
    <div class="cyber-grid-layer" />
    <section class="city-card">
      <h1>我的城市</h1>
      <p>左侧为城市名称，右侧实时展示天气与温度。</p>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          class="search-input"
          placeholder="输入城市名称，按回车搜索"
          clearable
          @keydown.enter="handleSearch"
        />
        <el-button type="primary" :loading="loading" @click="handleSearch">搜索</el-button>
      </div>
      <p v-if="error" class="error-text">{{ error }}</p>
      <CityList :items="cityItems" />
    </section>
  </main>
</template>

<style scoped>
.list-page {
  position: relative;
  min-height: calc(100vh - var(--app-nav-height));
  padding: 26px 16px 34px;
  background:
    radial-gradient(circle at 15% 12%, rgba(0, 255, 255, 0.18), transparent 38%),
    radial-gradient(circle at 82% 88%, rgba(255, 0, 153, 0.14), transparent 46%),
    linear-gradient(180deg, #051028 0%, #020816 100%);
}

.city-card {
  position: relative;
  z-index: 1;
  width: min(980px, 100%);
  margin: 0 auto;
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background: var(--cyber-glass-bg);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.1),
    var(--cyber-glow-md);
  backdrop-filter: blur(6px);
  padding: 24px;
}

.city-card h1 {
  margin: 0;
  color: var(--cyber-cyan);
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.48);
}

.city-card p {
  margin-top: 10px;
  color: var(--cyber-text-muted);
}

.search-bar {
  margin-top: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(5, 20, 45, 0.6);
  box-shadow: inset 0 0 0 1px rgba(117, 241, 255, 0.24);
}

.error-text {
  margin-top: 10px;
  color: #ff88b8;
}

@media (max-width: 640px) {
  .list-page {
    min-height: calc(100vh - var(--app-nav-height-mobile));
    padding-top: 20px;
  }

  .search-bar {
    grid-template-columns: 1fr;
  }
}
</style>
