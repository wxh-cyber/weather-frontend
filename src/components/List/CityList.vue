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
    <div v-if="items.length === 0" class="empty-state" data-city-list-empty="true">
      <span class="empty-state__grid" aria-hidden="true" />
      <p class="empty-state__code">CITY_LIST://EMPTY</p>
      <p class="empty-state__title">当前城市列表中还没有城市！</p>
      <p class="empty-state__desc">城市卡片面板暂未接入目标城市，请先在上方管理中枢新增城市。</p>
    </div>
    <div v-else class="city-list">
      <CityListItem
        v-for="(item, index) in items"
        :key="item.cityName"
        :city-name="item.cityName"
        :weather-text="item.weatherText"
        :temperature="item.temperature"
        :is-default="index === 0"
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
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.empty-state {
  position: relative;
  overflow: hidden;
  padding: 26px 18px;
  text-align: center;
  border: 1px dashed rgba(117, 241, 255, 0.36);
  border-radius: 16px;
  background:
    radial-gradient(circle at top, rgba(117, 241, 255, 0.12), transparent 40%),
    linear-gradient(145deg, rgba(255, 82, 205, 0.08), rgba(0, 214, 255, 0.06)),
    rgba(5, 20, 45, 0.54);
  box-shadow:
    inset 0 1px 0 rgba(180, 252, 255, 0.08),
    inset 0 0 18px rgba(117, 241, 255, 0.08),
    0 0 18px rgba(117, 241, 255, 0.08);
}

.empty-state__grid {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(117, 241, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(117, 241, 255, 0.05) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.5;
  pointer-events: none;
}

.empty-state__code,
.empty-state__title,
.empty-state__desc {
  position: relative;
  z-index: 1;
  margin: 0;
}

.empty-state__code {
  color: rgba(117, 241, 255, 0.68);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.empty-state__title {
  margin-top: 10px;
  color: var(--cyber-cyan);
  font-size: 22px;
  letter-spacing: 0.06em;
  text-shadow:
    0 0 12px rgba(117, 241, 255, 0.42),
    0 0 18px rgba(255, 82, 205, 0.14);
}

.empty-state__desc {
  margin-top: 10px;
  color: var(--cyber-text-muted);
  line-height: 1.7;
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.22);
}

@media (max-width: 1023px) {
  .city-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .city-list {
    grid-template-columns: 1fr;
  }
}
</style>
