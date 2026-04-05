<script setup lang="ts">
import CityListItem from '@/components/List/CityListItem.vue'

export interface CityListItemData {
  cityName: string
  weatherText: string
  temperature: string
}

defineProps<{
  items: CityListItemData[]
}>()
</script>

<template>
  <section class="city-list-panel">
    <div v-if="items.length === 0" class="empty-state">暂无城市数据</div>
    <div v-else class="city-list">
      <CityListItem
        v-for="item in items"
        :key="item.cityName"
        :city-name="item.cityName"
        :weather-text="item.weatherText"
        :temperature="item.temperature"
      />
    </div>
  </section>
</template>

<style scoped>
.city-list-panel {
  margin-top: 14px;
}

.city-list {
  display: grid;
  gap: 10px;
}

.empty-state {
  padding: 22px 14px;
  text-align: center;
  color: var(--cyber-text-muted);
  border: 1px dashed rgba(117, 241, 255, 0.32);
  background: rgba(5, 20, 45, 0.44);
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.35);
}
</style>
