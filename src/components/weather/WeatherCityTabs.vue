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
  border: 1px solid rgba(117, 241, 255, 0.28);
  border-radius: 12px;
  background: rgba(8, 26, 56, 0.76);
  color: var(--cyber-text-muted);
  padding: 10px 16px;
  white-space: nowrap;
  transition: all var(--cyber-ease);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
}

.tab:hover {
  border-color: rgba(117, 241, 255, 0.6);
  color: var(--cyber-cyan);
  box-shadow: 0 0 10px rgba(117, 241, 255, 0.28);
}

@media (prefers-reduced-motion: reduce) {
  .tab {
    animation: none;
  }
}
</style>
