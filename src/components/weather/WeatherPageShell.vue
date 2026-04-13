<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getCityBackgroundVariant, resolveCityBackground } from '@/utils/cityBackgrounds'
import { resolveWeatherOverlayPhase } from '@/utils/weatherOverlays'

const props = defineProps<{
  cityName?: string
  weatherText?: string
}>()

interface RainDropSpec {
  left: string
  top: string
  height: string
  opacity: number
  duration: string
  delay: string
}

interface SnowFlakeSpec {
  left: string
  top: string
  size: string
  opacity: number
  duration: string
  delay: string
  driftX: string
  rotate: string
  shimmer: string
}

const createRainDrops = (
  points: number[],
  lengths: number[],
  durations: number[],
  delays: number[],
  topOffsets: number[],
  opacityOptions?: {
    base?: number
    step?: number
  },
): RainDropSpec[] =>
  points.map((point, index) => ({
    left: `${point}%`,
    top: `${topOffsets[index % topOffsets.length]}%`,
    height: `${lengths[index % lengths.length]}px`,
    opacity: Number(
      ((opacityOptions?.base ?? 0.16) + (index % 4) * (opacityOptions?.step ?? 0.04)).toFixed(2),
    ),
    duration: `${durations[index % durations.length]}s`,
    delay: `${delays[index % delays.length]}s`,
  }))

const rainBackdropDrops = createRainDrops(
  [4, 9, 14, 21, 27, 34, 41, 49, 57, 64, 72, 80, 88, 95],
  [88, 96, 104, 92],
  [2.8, 3.1, 3.4],
  [-2.2, -0.8, -3.4, -1.6, -4.1],
  [-28, -18, -36, -24],
  { base: 0.18, step: 0.04 },
)

const rainMidDrops = createRainDrops(
  [3, 7, 11, 15, 19, 23, 27, 31, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 94, 98],
  [128, 142, 154, 136, 146],
  [1.7, 1.9, 2.05, 1.82],
  [-0.5, -1.4, -2.8, -3.5, -4.2, -1.9],
  [-42, -30, -36, -24, -48],
  { base: 0.28, step: 0.055 },
)

const rainFrontDrops = createRainDrops(
  [6, 13, 19, 26, 33, 40, 47, 55, 63, 71, 79, 87, 94],
  [184, 198, 214, 206],
  [1.18, 1.28, 1.36],
  [-1.1, -2.6, -3.8, -0.4, -4.5],
  [-56, -44, -62, -38],
  { base: 0.34, step: 0.06 },
)

const thunderMidDrops = createRainDrops(
  [2, 6, 10, 14, 18, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 87, 92, 96, 99],
  [152, 166, 182, 170, 158],
  [1.42, 1.54, 1.66, 1.48],
  [-0.3, -1.1, -2.1, -3.2, -4.4, -1.8],
  [-48, -36, -58, -42, -28],
  { base: 0.34, step: 0.06 },
)

const thunderFrontDrops = createRainDrops(
  [5, 11, 17, 24, 31, 39, 47, 55, 63, 71, 79, 87, 94],
  [206, 222, 238, 214],
  [0.96, 1.08, 1.16],
  [-0.8, -1.9, -3.1, -4.3, -2.6],
  [-68, -54, -74, -46],
  { base: 0.4, step: 0.07 },
)

const createSnowFlakes = (
  points: number[],
  sizes: number[],
  durations: number[],
  delays: number[],
  topOffsets: number[],
  drifts: number[],
  rotates: number[],
  shimmers: number[],
  opacityOptions?: {
    base?: number
    step?: number
  },
): SnowFlakeSpec[] =>
  points.map((point, index) => ({
    left: `${point}%`,
    top: `${topOffsets[index % topOffsets.length]}%`,
    size: `${sizes[index % sizes.length]}px`,
    opacity: Number(
      ((opacityOptions?.base ?? 0.2) + (index % 4) * (opacityOptions?.step ?? 0.04)).toFixed(2),
    ),
    duration: `${durations[index % durations.length]}s`,
    delay: `${delays[index % delays.length]}s`,
    driftX: `${drifts[index % drifts.length]}vw`,
    rotate: `${rotates[index % rotates.length]}deg`,
    shimmer: `${shimmers[index % shimmers.length]}s`,
  }))

const snowBackFlakes = createSnowFlakes(
  [4, 11, 18, 25, 33, 40, 48, 57, 65, 74, 82, 90, 97],
  [4, 5, 6, 5, 7],
  [18, 20, 22, 19],
  [-4, -11, -7, -15, -2],
  [-20, -32, -14, -26],
  [1.4, -1.1, 1.8, -1.6],
  [6, -8, 10, -6],
  [4.8, 5.4, 5.1],
  { base: 0.28, step: 0.055 },
)

const snowMidFlakes = createSnowFlakes(
  [3, 9, 14, 20, 27, 34, 41, 47, 53, 60, 67, 73, 79, 86, 92, 98],
  [6, 7, 8, 7, 9],
  [13, 15, 16.5, 14],
  [-5, -12, -8, -15, -2, -10],
  [-34, -18, -28, -12, -24],
  [2.4, -1.8, 3.1, -2.5, 1.6],
  [12, -14, 16, -10, 8],
  [4.1, 4.8, 5.2],
  { base: 0.38, step: 0.065 },
)

const snowFrontFlakes = createSnowFlakes(
  [6, 14, 23, 31, 40, 50, 61, 72, 84, 93],
  [10, 11, 13, 12, 14],
  [10.5, 11.5, 12.5],
  [-3, -9, -14, -6, -12],
  [-42, -26, -34, -18],
  [3.8, -2.9, 4.6, -3.4],
  [18, -22, 26, -16, 14],
  [3.4, 3.8, 4.2],
  { base: 0.46, step: 0.075 },
)

const backgroundTime = ref(new Date())
const overlayTime = ref(new Date())
const isMobileViewport = ref(false)
const prefersReducedMotion = ref(false)

let backgroundTimer: number | null = null
let overlayTimer: number | null = null
let mobileMediaQuery: MediaQueryList | null = null
let reducedMotionMediaQuery: MediaQueryList | null = null
let mediaCleanupCallbacks: Array<() => void> = []

const normalizedCityName = computed(() => props.cityName?.trim() ?? '')
const backgroundVariant = computed(() => getCityBackgroundVariant(backgroundTime.value))
const backgroundUrl = computed(() =>
  normalizedCityName.value ? resolveCityBackground(normalizedCityName.value, backgroundTime.value) : '',
)
const backgroundKey = computed(
  () => `${normalizedCityName.value || 'empty'}:${backgroundVariant.value}:${backgroundUrl.value || 'none'}`,
)
const weatherOverlayPhase = computed(() => resolveWeatherOverlayPhase(props.weatherText ?? '', overlayTime.value))
const hasWeatherOverlay = computed(() => weatherOverlayPhase.value.layer !== 'none')
const weatherOverlayLayerClass = computed(() => `weather-overlay-layer--${weatherOverlayPhase.value.layer}`)
const performanceMode = computed(() => (isMobileViewport.value || prefersReducedMotion.value ? 'lite' : 'full'))
const needsPhaseTicker = computed(
  () => weatherOverlayPhase.value.kind === 'showers' || weatherOverlayPhase.value.kind === 'thunder-showers',
)
const isThunderRainPhase = computed(
  () => weatherOverlayPhase.value.kind === 'thunder-showers' && weatherOverlayPhase.value.layer === 'rainy',
)
const activeRainMidDrops = computed(() => {
  const source = isThunderRainPhase.value ? thunderMidDrops : rainMidDrops
  return performanceMode.value === 'lite' ? source.slice(0, Math.max(14, source.length - 6)) : source
})
const activeRainFrontDrops = computed(() => {
  const source = isThunderRainPhase.value ? thunderFrontDrops : rainFrontDrops
  return performanceMode.value === 'lite' ? source.slice(0, Math.max(5, source.length - 4)) : source
})
const activeSnowBackFlakes = computed(() =>
  performanceMode.value === 'lite' ? snowBackFlakes.slice(0, Math.max(8, snowBackFlakes.length - 3)) : snowBackFlakes,
)
const activeSnowMidFlakes = computed(() =>
  performanceMode.value === 'lite' ? snowMidFlakes.slice(0, Math.max(10, snowMidFlakes.length - 5)) : snowMidFlakes,
)
const activeSnowFrontFlakes = computed(() =>
  performanceMode.value === 'lite' ? snowFrontFlakes.slice(0, Math.max(4, snowFrontFlakes.length - 5)) : snowFrontFlakes,
)

const syncBackgroundTime = () => {
  backgroundTime.value = new Date()
}

const syncOverlayTime = () => {
  overlayTime.value = new Date()
}

const clearOverlayTimer = () => {
  if (overlayTimer !== null) {
    window.clearInterval(overlayTimer)
    overlayTimer = null
  }
}

const syncPerformanceSignals = () => {
  isMobileViewport.value = (mobileMediaQuery?.matches ?? false) || window.innerWidth <= 768
  prefersReducedMotion.value = reducedMotionMediaQuery?.matches === true
}

const bindMediaQuery = (query: string, assign: (list: MediaQueryList) => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }

  const mediaQuery = window.matchMedia(query)
  assign(mediaQuery)

  const handleChange = () => {
    syncPerformanceSignals()
  }

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleChange)
    mediaCleanupCallbacks.push(() => mediaQuery.removeEventListener('change', handleChange))
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(handleChange)
    mediaCleanupCallbacks.push(() => mediaQuery.removeListener(handleChange))
  }
}

const syncOverlayTicker = () => {
  clearOverlayTimer()
  syncOverlayTime()

  if (!needsPhaseTicker.value) {
    return
  }

  overlayTimer = window.setInterval(syncOverlayTime, 250)
}

onMounted(() => {
  bindMediaQuery('(max-width: 768px)', (list) => {
    mobileMediaQuery = list
  })
  bindMediaQuery('(prefers-reduced-motion: reduce)', (list) => {
    reducedMotionMediaQuery = list
  })
  syncPerformanceSignals()
  syncBackgroundTime()
  syncOverlayTicker()
  backgroundTimer = window.setInterval(syncBackgroundTime, 60_000)
})

onBeforeUnmount(() => {
  if (backgroundTimer !== null) {
    window.clearInterval(backgroundTimer)
  }
  clearOverlayTimer()
  mediaCleanupCallbacks.forEach((cleanup) => cleanup())
  mediaCleanupCallbacks = []
})

watch(() => props.weatherText, syncOverlayTicker)
</script>

<template>
  <main class="weather-page" :data-weather-performance-mode="performanceMode">
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
        <div
          v-if="hasWeatherOverlay"
          class="weather-overlay-stage"
          :data-weather-overlay-kind="weatherOverlayPhase.kind"
          :data-weather-overlay-layer="weatherOverlayPhase.layer"
        >
          <div class="weather-overlay-layer weather-overlay-layer--grain" />
          <div class="weather-overlay-layer weather-overlay-layer--ambient" :class="weatherOverlayLayerClass" />
          <div
            v-if="weatherOverlayPhase.layer === 'sunny'"
            class="weather-overlay-layer weather-overlay-layer--sunbeams"
          />
          <div
            v-if="weatherOverlayPhase.layer === 'cloudy' || weatherOverlayPhase.layer === 'overcast'"
            class="weather-overlay-layer weather-overlay-layer--cloud-banks"
            :class="weatherOverlayLayerClass"
          />
          <div
            v-if="weatherOverlayPhase.layer === 'rainy'"
            class="weather-overlay-layer weather-overlay-layer--rain"
            :class="{ 'is-thunderstorm': isThunderRainPhase }"
            data-weather-rain-stage="active"
          >
            <div class="weather-rain-contrast" data-weather-rain-contrast="active" />
            <div class="weather-rain-mist" />
            <div class="weather-rain-stream-group weather-rain-stream-group--backdrop" data-weather-rain-group="back">
              <span
                v-for="(drop, index) in rainBackdropDrops"
                :key="`back-${index}`"
                class="weather-rain-drop weather-rain-drop--backdrop"
                :style="{
                  left: drop.left,
                  top: drop.top,
                  height: drop.height,
                  opacity: String(drop.opacity),
                  animationDuration: drop.duration,
                  animationDelay: drop.delay,
                }"
              />
            </div>
            <div class="weather-rain-stream-group weather-rain-stream-group--mid" data-weather-rain-group="mid">
              <span
                v-for="(drop, index) in activeRainMidDrops"
                :key="`mid-${index}`"
                class="weather-rain-drop weather-rain-drop--mid"
                :style="{
                  left: drop.left,
                  top: drop.top,
                  height: drop.height,
                  opacity: String(drop.opacity),
                  animationDuration: drop.duration,
                  animationDelay: drop.delay,
                }"
              />
            </div>
            <div class="weather-rain-stream-group weather-rain-stream-group--front" data-weather-rain-group="front">
              <span
                v-for="(drop, index) in activeRainFrontDrops"
                :key="`front-${index}`"
                class="weather-rain-drop weather-rain-drop--front"
                :style="{
                  left: drop.left,
                  top: drop.top,
                  height: drop.height,
                  opacity: String(drop.opacity),
                  animationDuration: drop.duration,
                  animationDelay: drop.delay,
                }"
              />
            </div>
          </div>
          <div
            v-if="weatherOverlayPhase.layer === 'snowy'"
            class="weather-overlay-layer weather-overlay-layer--snow"
            data-weather-snow-stage="active"
          >
            <div class="weather-snow-haze" />
            <div class="weather-snow-group weather-snow-group--back" data-weather-snow-group="back">
              <span
                v-for="(flake, index) in activeSnowBackFlakes"
                :key="`snow-back-${index}`"
                class="weather-snow-flake weather-snow-flake--back"
                :style="{
                  left: flake.left,
                  top: flake.top,
                  width: flake.size,
                  height: flake.size,
                  opacity: String(flake.opacity),
                  animationDuration: flake.duration,
                  animationDelay: flake.delay,
                  '--snow-drift-x': flake.driftX,
                  '--snow-rotate': flake.rotate,
                  '--snow-shimmer-duration': flake.shimmer,
                }"
              />
            </div>
            <div class="weather-snow-group weather-snow-group--mid" data-weather-snow-group="mid">
              <span
                v-for="(flake, index) in activeSnowMidFlakes"
                :key="`snow-mid-${index}`"
                class="weather-snow-flake weather-snow-flake--mid"
                :style="{
                  left: flake.left,
                  top: flake.top,
                  width: flake.size,
                  height: flake.size,
                  opacity: String(flake.opacity),
                  animationDuration: flake.duration,
                  animationDelay: flake.delay,
                  '--snow-drift-x': flake.driftX,
                  '--snow-rotate': flake.rotate,
                  '--snow-shimmer-duration': flake.shimmer,
                }"
              />
            </div>
            <div class="weather-snow-group weather-snow-group--front" data-weather-snow-group="front">
              <span
                v-for="(flake, index) in activeSnowFrontFlakes"
                :key="`snow-front-${index}`"
                class="weather-snow-flake weather-snow-flake--front"
                :style="{
                  left: flake.left,
                  top: flake.top,
                  width: flake.size,
                  height: flake.size,
                  opacity: String(flake.opacity),
                  animationDuration: flake.duration,
                  animationDelay: flake.delay,
                  '--snow-drift-x': flake.driftX,
                  '--snow-rotate': flake.rotate,
                  '--snow-shimmer-duration': flake.shimmer,
                }"
              />
            </div>
          </div>
          <div
            v-if="weatherOverlayPhase.isLightningActive"
            class="weather-overlay-layer weather-overlay-layer--lightning"
          />
        </div>
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
  contain: layout paint style;
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
  contain: layout paint;
}

.weather-page__scroll {
  position: relative;
  z-index: 1;
  height: calc(100vh - var(--app-nav-height));
  overflow-y: auto;
  overflow-x: hidden;
  padding: 26px 16px 34px;
  contain: layout paint;
}

.city-background-stage {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  contain: layout paint;
}

.city-background-layer,
.city-background-overlay,
.weather-overlay-stage,
.weather-overlay-layer {
  position: absolute;
  inset: 0;
}

.city-background-layer {
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  transform: scale(1.025);
  filter: saturate(1.03) brightness(0.86) contrast(1.04);
  animation: weather-neon-breathe 5.8s ease-in-out infinite;
  box-shadow:
    inset 0 0 70px rgba(3, 8, 24, 0.05),
    inset 0 0 120px rgba(117, 241, 255, 0.03);
  will-change: transform, filter, opacity;
}

.city-background-layer--empty {
  background:
    radial-gradient(circle at 22% 18%, rgba(117, 241, 255, 0.14), transparent 34%),
    radial-gradient(circle at 82% 82%, rgba(255, 82, 205, 0.12), transparent 36%),
    linear-gradient(180deg, rgba(6, 18, 42, 0.92), rgba(2, 8, 22, 0.98));
}

.city-background-overlay {
  background:
    linear-gradient(180deg, rgba(2, 8, 22, 0.1), rgba(2, 8, 22, 0.38)),
    radial-gradient(circle at 18% 14%, rgba(117, 241, 255, 0.14), transparent 30%),
    radial-gradient(circle at 82% 82%, rgba(255, 82, 205, 0.1), transparent 34%);
  backdrop-filter: blur(0.8px);
}

.weather-overlay-stage {
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  contain: layout paint;
}

.weather-overlay-layer {
  pointer-events: none;
  mix-blend-mode: screen;
}

.weather-overlay-layer--grain {
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.04) 0 0.7px, transparent 1px),
    radial-gradient(circle at 72% 18%, rgba(117, 241, 255, 0.03) 0 0.8px, transparent 1.2px),
    radial-gradient(circle at 48% 76%, rgba(255, 255, 255, 0.03) 0 0.6px, transparent 1px);
  background-size: 26px 26px, 32px 32px, 28px 28px;
  opacity: 0.18;
  mix-blend-mode: soft-light;
}

.weather-overlay-layer--ambient.weather-overlay-layer--sunny {
  background:
    radial-gradient(circle at 16% 18%, rgba(255, 229, 154, 0.16), transparent 16%),
    radial-gradient(circle at 68% 22%, rgba(255, 218, 124, 0.09), transparent 14%),
    radial-gradient(circle at 46% 78%, rgba(255, 196, 84, 0.05), transparent 19%);
  animation: sunny-drift 16s ease-in-out infinite;
}

.weather-overlay-layer--sunbeams {
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 239, 188, 0.16), transparent 11%),
    linear-gradient(120deg, transparent 30%, rgba(255, 226, 140, 0.06) 44%, transparent 58%),
    linear-gradient(140deg, transparent 38%, rgba(255, 210, 112, 0.04) 51%, transparent 64%);
  opacity: 0.58;
  animation: sunbeam-sway 18s ease-in-out infinite;
}

.weather-overlay-layer--ambient.weather-overlay-layer--cloudy {
  background:
    radial-gradient(ellipse at 15% 26%, rgba(231, 244, 255, 0.1), transparent 20%),
    radial-gradient(ellipse at 48% 18%, rgba(214, 232, 252, 0.08), transparent 18%),
    radial-gradient(ellipse at 82% 30%, rgba(228, 239, 255, 0.1), transparent 22%);
  animation: cloud-drift 26s linear infinite;
}

.weather-overlay-layer--ambient.weather-overlay-layer--overcast {
  background:
    linear-gradient(180deg, rgba(51, 63, 84, 0.14), rgba(18, 24, 38, 0.06)),
    radial-gradient(ellipse at 18% 24%, rgba(181, 191, 208, 0.11), transparent 22%),
    radial-gradient(ellipse at 56% 18%, rgba(156, 169, 188, 0.12), transparent 25%),
    radial-gradient(ellipse at 84% 30%, rgba(128, 139, 159, 0.08), transparent 22%);
  animation: overcast-pulse 24s ease-in-out infinite;
}

.weather-overlay-layer--cloud-banks.weather-overlay-layer--cloudy,
.weather-overlay-layer--cloud-banks.weather-overlay-layer--overcast {
  background:
    radial-gradient(ellipse at 10% 64%, rgba(255, 255, 255, 0.06), transparent 16%),
    radial-gradient(ellipse at 34% 54%, rgba(242, 248, 255, 0.08), transparent 18%),
    radial-gradient(ellipse at 64% 68%, rgba(233, 240, 248, 0.06), transparent 16%),
    radial-gradient(ellipse at 88% 56%, rgba(245, 249, 255, 0.06), transparent 18%);
  opacity: 0.62;
  animation: cloud-bank-slide 34s linear infinite;
}

.weather-overlay-layer--cloud-banks.weather-overlay-layer--overcast {
  opacity: 0.74;
  filter: saturate(0.74) brightness(0.76);
}

.weather-overlay-layer--rain {
  opacity: 0.88;
  mix-blend-mode: normal;
  overflow: hidden;
  contain: paint;
}

.weather-overlay-layer--rain.is-thunderstorm {
  opacity: 0.94;
}

.weather-rain-contrast,
.weather-rain-mist,
.weather-rain-stream-group {
  position: absolute;
  inset: -18% -12%;
  pointer-events: none;
}

.weather-rain-contrast {
  inset: 0;
  background:
    linear-gradient(180deg, rgba(24, 34, 49, 0.14), rgba(12, 18, 29, 0.05)),
    linear-gradient(112deg, transparent 15%, rgba(42, 61, 84, 0.14) 42%, transparent 70%),
    radial-gradient(circle at 24% 18%, rgba(86, 111, 138, 0.11), transparent 24%),
    radial-gradient(circle at 76% 34%, rgba(60, 78, 102, 0.09), transparent 22%);
  mix-blend-mode: multiply;
}

.weather-rain-mist {
  inset: 0;
  background:
    linear-gradient(180deg, rgba(84, 108, 135, 0.14), rgba(28, 39, 54, 0.06)),
    radial-gradient(circle at 18% 24%, rgba(175, 205, 232, 0.12), transparent 22%),
    radial-gradient(circle at 72% 34%, rgba(144, 179, 210, 0.1), transparent 24%);
  mix-blend-mode: soft-light;
}

.weather-rain-stream-group {
  overflow: hidden;
  contain: paint;
}

.weather-rain-stream-group--backdrop {
  transform: rotate(10deg);
}

.weather-rain-stream-group--mid {
  transform: rotate(11.5deg);
}

.weather-rain-stream-group--front {
  transform: rotate(13deg);
}

.weather-overlay-layer--rain.is-thunderstorm .weather-rain-stream-group--mid {
  transform: rotate(12.5deg);
}

.weather-overlay-layer--rain.is-thunderstorm .weather-rain-stream-group--front {
  transform: rotate(14.2deg);
}

.weather-rain-drop {
  position: absolute;
  width: 1.35px;
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(8, 16, 25, 0), rgba(8, 16, 25, 0.52) 48%, rgba(8, 16, 25, 0)),
    linear-gradient(180deg, rgba(244, 249, 255, 0), rgba(209, 230, 248, 0.98) 34%, rgba(244, 249, 255, 0));
  transform: translate3d(0, -120%, 0);
  transform-origin: center top;
  will-change: transform, opacity;
  box-shadow:
    0 0 0 0.28px rgba(9, 17, 26, 0.34),
    0 0 1.4px rgba(229, 242, 255, 0.26);
}

.weather-rain-drop--backdrop {
  width: 1px;
  background:
    linear-gradient(180deg, rgba(18, 28, 40, 0), rgba(18, 28, 40, 0.3) 48%, rgba(18, 28, 40, 0)),
    linear-gradient(180deg, rgba(208, 226, 244, 0), rgba(178, 202, 224, 0.78) 42%, rgba(208, 226, 244, 0));
  filter: blur(0.2px);
  animation: rain-drop-back linear infinite;
}

.weather-rain-drop--mid {
  width: 1.5px;
  background:
    linear-gradient(180deg, rgba(8, 16, 25, 0), rgba(8, 16, 25, 0.58) 50%, rgba(8, 16, 25, 0)),
    linear-gradient(180deg, rgba(248, 252, 255, 0), rgba(220, 238, 252, 0.98) 18%, rgba(186, 215, 238, 0.96) 48%, rgba(248, 252, 255, 0));
  box-shadow:
    0 0 0 0.45px rgba(7, 15, 23, 0.42),
    0 0 3px rgba(232, 243, 255, 0.34);
  animation: rain-drop-mid linear infinite;
}

.weather-rain-drop--front {
  width: 2px;
  background:
    linear-gradient(180deg, rgba(5, 11, 18, 0), rgba(5, 11, 18, 0.64) 48%, rgba(5, 11, 18, 0)),
    linear-gradient(180deg, rgba(254, 255, 255, 0), rgba(241, 249, 255, 0.98) 14%, rgba(215, 236, 252, 1) 34%, rgba(254, 255, 255, 0));
  filter: blur(0.18px);
  box-shadow:
    0 0 0 0.62px rgba(6, 12, 18, 0.46),
    0 0 4px rgba(243, 249, 255, 0.4);
  animation: rain-drop-front linear infinite;
}

.weather-overlay-layer--rain.is-thunderstorm .weather-rain-drop--mid {
  width: 1.7px;
  background:
    linear-gradient(180deg, rgba(4, 10, 18, 0), rgba(4, 10, 18, 0.68) 50%, rgba(4, 10, 18, 0)),
    linear-gradient(180deg, rgba(250, 253, 255, 0), rgba(229, 242, 252, 1) 16%, rgba(201, 227, 246, 1) 46%, rgba(250, 253, 255, 0));
  box-shadow:
    0 0 0 0.56px rgba(4, 10, 18, 0.48),
    0 0 3.8px rgba(240, 247, 255, 0.4);
}

.weather-overlay-layer--rain.is-thunderstorm .weather-rain-drop--front {
  width: 2.15px;
  background:
    linear-gradient(180deg, rgba(3, 8, 14, 0), rgba(3, 8, 14, 0.74) 48%, rgba(3, 8, 14, 0)),
    linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(246, 251, 255, 1) 12%, rgba(226, 241, 254, 1) 32%, rgba(255, 255, 255, 0));
  box-shadow:
    0 0 0 0.72px rgba(3, 8, 14, 0.5),
    0 0 4.8px rgba(245, 250, 255, 0.46);
}

.weather-overlay-layer--snow {
  opacity: 0.9;
  mix-blend-mode: normal;
  overflow: hidden;
  contain: paint;
}

.weather-snow-haze,
.weather-snow-group {
  position: absolute;
  inset: -16% -10%;
  pointer-events: none;
}

.weather-snow-haze {
  inset: 0;
  background:
    linear-gradient(180deg, rgba(118, 140, 168, 0.08), rgba(44, 60, 82, 0.04)),
    linear-gradient(116deg, transparent 12%, rgba(85, 107, 132, 0.09) 42%, transparent 72%),
    radial-gradient(circle at 18% 20%, rgba(236, 244, 255, 0.16), transparent 22%),
    radial-gradient(circle at 72% 28%, rgba(212, 228, 244, 0.1), transparent 24%),
    radial-gradient(circle at 50% 76%, rgba(200, 220, 240, 0.08), transparent 22%);
  mix-blend-mode: soft-light;
}

.weather-overlay-layer--snow::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(26, 36, 49, 0.07), rgba(9, 14, 22, 0.01)),
    linear-gradient(128deg, transparent 16%, rgba(46, 62, 84, 0.08) 46%, transparent 74%);
  mix-blend-mode: multiply;
  pointer-events: none;
}

.weather-snow-group {
  overflow: hidden;
  contain: paint;
}

.weather-snow-group--back {
  filter: blur(0.28px);
}

.weather-snow-group--mid {
  filter: blur(0.08px);
}

.weather-snow-group--front {
  filter: blur(0.02px);
}

.weather-snow-flake {
  position: absolute;
  border-radius: 999px;
  background:
    radial-gradient(circle at 34% 30%, rgba(255, 255, 255, 1) 0 22%, rgba(255, 255, 255, 0.72) 42%, rgba(255, 255, 255, 0) 72%),
    radial-gradient(circle at 62% 60%, rgba(214, 233, 252, 0.94) 0 18%, transparent 60%),
    radial-gradient(circle at center, rgba(246, 251, 255, 0.98) 0 36%, rgba(187, 211, 236, 0.42) 56%, rgba(32, 44, 59, 0.12) 72%, transparent 84%);
  box-shadow:
    0 0 6px rgba(244, 249, 255, 0.28),
    0 0 0 0.5px rgba(28, 40, 56, 0.18),
    0 0 0 1px rgba(216, 232, 248, 0.12);
  transform: translate3d(0, -18vh, 0) rotate(0deg);
  will-change: transform, opacity;
  animation-name: snow-flake-drift;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.weather-snow-flake::before,
.weather-snow-flake::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 999px;
  pointer-events: none;
}

.weather-snow-flake::before {
  background:
    linear-gradient(140deg, rgba(255, 255, 255, 0.96), transparent 54%),
    radial-gradient(circle at 62% 58%, rgba(226, 241, 255, 0.68), transparent 56%);
  opacity: 0.7;
  mix-blend-mode: screen;
  animation: snow-flake-shimmer var(--snow-shimmer-duration, 4.8s) ease-in-out infinite;
}

.weather-snow-flake::after {
  inset: 18%;
  background:
    linear-gradient(45deg, transparent 22%, rgba(246, 251, 255, 0.92) 50%, transparent 78%),
    linear-gradient(135deg, transparent 28%, rgba(214, 233, 251, 0.68) 52%, transparent 74%);
  opacity: 0.32;
  filter: blur(0.2px);
  transform: rotate(24deg);
}

.weather-snow-flake--back {
  box-shadow:
    0 0 4px rgba(236, 245, 255, 0.2),
    0 0 0 0.45px rgba(24, 36, 50, 0.16),
    0 0 0 1px rgba(214, 229, 244, 0.1);
}

.weather-snow-flake--back::before {
  opacity: 0.42;
}

.weather-snow-flake--back::after {
  opacity: 0.18;
}

.weather-snow-flake--mid {
  box-shadow:
    0 0 7px rgba(242, 248, 255, 0.3),
    0 0 0 0.55px rgba(23, 34, 49, 0.2),
    0 0 0 1px rgba(220, 235, 249, 0.12);
}

.weather-snow-flake--mid::before {
  opacity: 0.76;
}

.weather-snow-flake--mid::after {
  opacity: 0.3;
}

.weather-snow-flake--front {
  box-shadow:
    0 0 10px rgba(246, 251, 255, 0.38),
    0 0 0 0.7px rgba(17, 26, 38, 0.24),
    0 0 0 1.2px rgba(229, 241, 252, 0.14);
}

.weather-snow-flake--front::before {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 1), transparent 52%),
    radial-gradient(circle at 58% 54%, rgba(229, 242, 255, 0.84), transparent 52%);
  opacity: 0.88;
}

.weather-snow-flake--front::after {
  inset: 14%;
  opacity: 0.42;
  filter: blur(0.14px);
}

.weather-overlay-layer--lightning {
  background:
    linear-gradient(112deg, transparent 36%, rgba(192, 115, 255, 0.14) 47%, transparent 57%),
    radial-gradient(circle at 72% 24%, rgba(186, 120, 255, 0.24), transparent 16%),
    radial-gradient(circle at 30% 38%, rgba(138, 92, 255, 0.12), transparent 14%);
  opacity: 0.76;
  animation: lightning-pulse 0.38s ease-out forwards;
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
    filter: saturate(1.03) brightness(0.86) contrast(1.04);
  }

  50% {
    filter: saturate(1.08) brightness(0.9) contrast(1.05);
  }
}

@keyframes sunny-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.48;
  }

  50% {
    transform: translate3d(1.2%, -1.2%, 0) scale(1.03);
    opacity: 0.66;
  }
}

@keyframes sunbeam-sway {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
  }

  50% {
    transform: translate3d(1.2%, -1.2%, 0) rotate(-1.4deg) scale(1.02);
  }
}

@keyframes cloud-drift {
  from {
    transform: translate3d(-2%, 0, 0);
  }

  to {
    transform: translate3d(2%, 0, 0);
  }
}

@keyframes overcast-pulse {
  0%,
  100% {
    opacity: 0.66;
  }

  50% {
    opacity: 0.8;
  }
}

@keyframes cloud-bank-slide {
  from {
    transform: translate3d(-5%, 0, 0);
  }

  to {
    transform: translate3d(5%, 0, 0);
  }
}

@keyframes rain-drop-back {
  from {
    transform: translate3d(-0.4vw, -30vh, 0);
  }

  to {
    transform: translate3d(1vw, 118vh, 0);
  }
}

@keyframes rain-drop-mid {
  from {
    transform: translate3d(-0.6vw, -34vh, 0);
  }

  to {
    transform: translate3d(1.6vw, 122vh, 0);
  }
}

@keyframes rain-drop-front {
  from {
    transform: translate3d(-0.8vw, -38vh, 0);
  }

  to {
    transform: translate3d(2vw, 126vh, 0);
  }
}

@keyframes snow-flake-drift {
  from {
    transform: translate3d(calc(var(--snow-drift-x) * -0.35), -22vh, 0) rotate(calc(var(--snow-rotate) * -0.35)) scale(0.94);
  }

  25% {
    transform: translate3d(calc(var(--snow-drift-x) * 0.28), 18vh, 0) rotate(calc(var(--snow-rotate) * 0.4)) scale(1);
  }

  50% {
    transform: translate3d(calc(var(--snow-drift-x) * -0.12), 52vh, 0) rotate(calc(var(--snow-rotate) * -0.18)) scale(1.03);
  }

  75% {
    transform: translate3d(calc(var(--snow-drift-x) * 0.66), 88vh, 0) rotate(calc(var(--snow-rotate) * 0.8)) scale(0.98);
  }

  to {
    transform: translate3d(var(--snow-drift-x), 130vh, 0) rotate(var(--snow-rotate)) scale(0.94);
  }
}

@keyframes snow-flake-shimmer {
  0%,
  100% {
    opacity: 0.42;
    filter: brightness(1) saturate(1);
  }

  50% {
    opacity: 0.92;
    filter: brightness(1.18) saturate(1.08);
  }
}

@keyframes lightning-pulse {
  0% {
    opacity: 0;
    filter: brightness(1);
  }

  35% {
    opacity: 0.78;
    filter: brightness(1.18);
  }

  100% {
    opacity: 0;
    filter: brightness(1);
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

.weather-page[data-weather-performance-mode='lite'] .city-background-layer {
  animation-duration: 9.2s;
  box-shadow:
    inset 0 0 42px rgba(3, 8, 24, 0.04),
    inset 0 0 78px rgba(117, 241, 255, 0.02);
}

.weather-page[data-weather-performance-mode='lite'] .city-background-overlay {
  backdrop-filter: blur(0.35px);
}

.weather-page[data-weather-performance-mode='lite'] .weather-overlay-layer--grain {
  opacity: 0.12;
}

.weather-page[data-weather-performance-mode='lite'] .weather-rain-contrast {
  background:
    linear-gradient(180deg, rgba(24, 34, 49, 0.1), rgba(12, 18, 29, 0.03)),
    linear-gradient(112deg, transparent 18%, rgba(42, 61, 84, 0.08) 42%, transparent 70%);
}

.weather-page[data-weather-performance-mode='lite'] .weather-rain-mist {
  background:
    linear-gradient(180deg, rgba(84, 108, 135, 0.1), rgba(28, 39, 54, 0.04)),
    radial-gradient(circle at 18% 24%, rgba(175, 205, 232, 0.08), transparent 22%);
}

.weather-page[data-weather-performance-mode='lite'] .weather-rain-drop--backdrop,
.weather-page[data-weather-performance-mode='lite'] .weather-rain-drop--front {
  filter: none;
}

.weather-page[data-weather-performance-mode='lite'] .weather-rain-drop--mid {
  box-shadow:
    0 0 0 0.32px rgba(7, 15, 23, 0.3),
    0 0 1.8px rgba(232, 243, 255, 0.22);
}

.weather-page[data-weather-performance-mode='lite'] .weather-rain-drop--front {
  box-shadow:
    0 0 0 0.4px rgba(6, 12, 18, 0.32),
    0 0 2.4px rgba(243, 249, 255, 0.24);
}

.weather-page[data-weather-performance-mode='lite'] .weather-snow-haze {
  background:
    linear-gradient(180deg, rgba(118, 140, 168, 0.05), rgba(44, 60, 82, 0.02)),
    radial-gradient(circle at 18% 20%, rgba(236, 244, 255, 0.1), transparent 22%);
}

.weather-page[data-weather-performance-mode='lite'] .weather-overlay-layer--snow::before {
  background:
    linear-gradient(180deg, rgba(26, 36, 49, 0.04), rgba(9, 14, 22, 0));
}

.weather-page[data-weather-performance-mode='lite'] .weather-snow-group--back,
.weather-page[data-weather-performance-mode='lite'] .weather-snow-group--mid,
.weather-page[data-weather-performance-mode='lite'] .weather-snow-group--front {
  filter: none;
}

.weather-page[data-weather-performance-mode='lite'] .weather-snow-flake {
  box-shadow:
    0 0 4px rgba(244, 249, 255, 0.18),
    0 0 0 0.4px rgba(28, 40, 56, 0.14);
}

.weather-page[data-weather-performance-mode='lite'] .weather-snow-flake::before {
  animation: none;
  opacity: 0.46;
}

.weather-page[data-weather-performance-mode='lite'] .weather-snow-flake::after {
  opacity: 0.18;
  filter: none;
}

@media (prefers-reduced-motion: reduce) {
  .city-background-layer {
    animation: none;
  }

  .weather-overlay-layer,
  .weather-rain-drop,
  .weather-snow-flake,
  .weather-snow-flake::before {
    animation: none;
  }

  .bg-fade-enter-active,
  .bg-fade-leave-active {
    transition: none;
  }
}
</style>
