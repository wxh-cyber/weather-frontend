<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  cityName: string
  weatherText: string
  temperature: string
}>()

const router = useRouter()
</script>

<template>
  <article class="city-item" @click="router.push(`/weather/${props.cityName}`)">
    <p class="city-name">{{ cityName }}</p>
    <div class="weather-side">
      <span class="weather-text">{{ weatherText }}</span>
      <strong class="temperature">{{ temperature }}</strong>
    </div>
  </article>
</template>

<style scoped>
.city-item {
  cursor: pointer;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(117, 241, 255, 0.24);
  background: linear-gradient(145deg, rgba(6, 22, 50, 0.78), rgba(4, 16, 36, 0.66));
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.1),
    0 0 8px rgba(117, 241, 255, 0.12);
  transition: transform var(--cyber-ease), border-color var(--cyber-ease), box-shadow var(--cyber-ease);
}

.city-item:hover {
  transform: translateY(-1px);
  border-color: rgba(117, 241, 255, 0.52);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.18),
    0 0 12px rgba(117, 241, 255, 0.24),
    0 0 18px rgba(255, 82, 205, 0.12);
}

.city-name {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.05em;
  color: #aaf8ff;
  text-shadow:
    0 0 8px rgba(117, 241, 255, 0.86),
    0 0 16px rgba(0, 145, 255, 0.4);
}

.weather-side {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--cyber-text-muted);
}

.weather-text {
  font-size: 14px;
  text-shadow:
    0 0 6px rgba(117, 241, 255, 0.42),
    0 0 10px rgba(255, 82, 205, 0.18);
}

.temperature {
  min-width: 56px;
  text-align: right;
  font-size: 26px;
  color: var(--cyber-cyan);
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.92),
    0 0 20px rgba(0, 145, 255, 0.5),
    0 0 24px rgba(255, 82, 205, 0.24);
}

@media (max-width: 640px) {
  .city-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .weather-side {
    justify-content: space-between;
  }

  .temperature {
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .city-item {
    transition: none;
  }
}
</style>
