<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getCityBackgroundVariant, resolveCityBackground } from '@/utils/cityBackgrounds'

const props = defineProps<{
  cityName?: string
}>()

const currentTime = ref(new Date())

let backgroundTimer: number | null = null

const normalizedCityName = computed(() => props.cityName?.trim() ?? '')
const backgroundVariant = computed(() => getCityBackgroundVariant(currentTime.value))
const backgroundUrl = computed(() =>
  normalizedCityName.value ? resolveCityBackground(normalizedCityName.value, currentTime.value) : '',
)
const backgroundKey = computed(
  () => `${normalizedCityName.value || 'empty'}:${backgroundVariant.value}:${backgroundUrl.value || 'none'}`,
)

const syncBackgroundTime = () => {
  currentTime.value = new Date()
}

onMounted(() => {
  syncBackgroundTime()
  backgroundTimer = window.setInterval(syncBackgroundTime, 60_000)
})

onBeforeUnmount(() => {
  if (backgroundTimer !== null) {
    window.clearInterval(backgroundTimer)
  }
})
</script>

<template>
  <main class="weather-page">
    <div class="weather-page__viewport">
      <div class="city-background-stage" aria-hidden="true">
        <Transition name="bg-fade" mode="out-in">
          <div
            v-if="backgroundUrl"
            :key="backgroundKey"
            class="city-background-layer"
            :data-background-key="backgroundKey"
            :style="{ backgroundImage: `url(${backgroundUrl})` }"
          />
          <div
            v-else
            key="empty"
            class="city-background-layer city-background-layer--empty"
            data-background-key="empty"
          />
        </Transition>
        <div class="city-background-overlay" />
      </div>
      <div class="cyber-grid-layer" />
      <div class="weather-page__scroll" data-testid="weather-page-scroll">
        <div class="container">
          <slot />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.weather-page {
  position: relative;
  color: var(--cyber-text);
}

.weather-page__viewport {
  position: relative;
  min-height: calc(100vh - var(--app-nav-height));
  background:
    radial-gradient(circle at 18% 10%, rgba(0, 255, 255, 0.18), transparent 38%),
    radial-gradient(circle at 85% 85%, rgba(255, 0, 153, 0.14), transparent 45%),
    linear-gradient(180deg, #051028 0%, #020816 100%);
  overflow: hidden;
  isolation: isolate;
}

.weather-page__scroll {
  position: relative;
  z-index: 1;
  height: calc(100vh - var(--app-nav-height));
  overflow-y: auto;
  overflow-x: hidden;
  padding: 26px 16px 34px;
}

.city-background-stage {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.city-background-layer,
.city-background-overlay {
  position: absolute;
  inset: 0;
}

.city-background-layer {
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  transform: scale(1.025);
  filter: saturate(1.02) brightness(0.82) contrast(1.03);
  animation: weather-neon-breathe 4.6s ease-in-out infinite;
  box-shadow:
    inset 0 0 80px rgba(3, 8, 24, 0.08),
    inset 0 0 120px rgba(117, 241, 255, 0.04);
}

.city-background-layer--empty {
  background:
    radial-gradient(circle at 22% 18%, rgba(117, 241, 255, 0.14), transparent 34%),
    radial-gradient(circle at 82% 82%, rgba(255, 82, 205, 0.12), transparent 36%),
    linear-gradient(180deg, rgba(6, 18, 42, 0.92), rgba(2, 8, 22, 0.98));
}

.city-background-overlay {
  background:
    linear-gradient(180deg, rgba(2, 8, 22, 0.14), rgba(2, 8, 22, 0.48)),
    radial-gradient(circle at 18% 14%, rgba(117, 241, 255, 0.18), transparent 32%),
    radial-gradient(circle at 82% 82%, rgba(255, 82, 205, 0.14), transparent 36%);
  backdrop-filter: blur(1.5px);
}

.container {
  width: min(1140px, 100%);
  margin: 0 auto;
  color: var(--cyber-text);
}

.bg-fade-enter-active,
.bg-fade-leave-active {
  transition:
    opacity 0.8s ease,
    filter 0.8s ease,
    transform 0.8s ease;
}

.bg-fade-enter-from,
.bg-fade-leave-to {
  opacity: 0;
  filter: saturate(1.18) brightness(0.94) contrast(1.08);
  transform: scale(1.035);
}

@keyframes weather-neon-breathe {
  0%,
  100% {
    filter: saturate(1.02) brightness(0.82) contrast(1.03);
  }

  50% {
    filter: saturate(1.08) brightness(0.87) contrast(1.05);
  }
}

@media (max-width: 640px) {
  .weather-page__viewport {
    min-height: calc(100vh - var(--app-nav-height-mobile));
  }

  .weather-page__scroll {
    height: calc(100vh - var(--app-nav-height-mobile));
    padding-top: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .city-background-layer {
    animation: none;
  }

  .bg-fade-enter-active,
  .bg-fade-leave-active {
    transition: none;
  }
}
</style>
