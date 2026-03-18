<script setup lang="ts">
defineProps<{
  cities: string[]
}>()
</script>

<template>
  <section class="tabs">
    <button v-for="city in cities" :key="city" class="tab">{{ city }}</button>
  </section>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.tab {
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  background: rgba(13, 39, 97, 0.75);
  color: #d5deff;
  padding: 10px 16px;
  white-space: nowrap;
}
</style>
