<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CityItem } from '@/store/city'
import { mapCityItemToDisplay, resolveDisplayCityName } from '@/utils/weather/cityNameDisplay'

const props = defineProps<{
  cities: CityItem[]
  defaultCityName: string
  selectedCityName: string
}>()

const emit = defineEmits<{
  (e: 'select', cityName: string): void
}>()

const displayCities = computed(() => props.cities.map((city) => mapCityItemToDisplay(city)))
const displayDefaultCityName = computed(() => resolveDisplayCityName(props.defaultCityName))
const displaySelectedCityName = computed(() => resolveDisplayCityName(props.selectedCityName))

const tabsRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLDivElement | null>(null)
const tabRefs = ref<Record<string, HTMLButtonElement | null>>({})
const indicatorStyle = ref({
  width: '0px',
  transform: 'translate3d(0, 0, 0)',
  opacity: '0',
})
const thumbWidth = ref(0)
const thumbOffset = ref(0)
const showScrollbar = ref(false)
const isScrollbarDragging = ref(false)

let dragStartX = 0
let dragStartOffset = 0

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const thumbStyle = computed(() => ({
  width: `${thumbWidth.value}px`,
  transform: `translate3d(${thumbOffset.value}px, 0, 0)`,
}))

const setTabRef = (cityName: string, el: HTMLButtonElement | null) => {
  if (el) {
    tabRefs.value[cityName] = el
    return
  }
  delete tabRefs.value[cityName]
}

const syncScrollbarFromScroll = () => {
  const container = tabsRef.value
  const track = trackRef.value
  if (!container || !track) return

  const maxScroll = container.scrollWidth - container.clientWidth
  if (maxScroll <= 0) {
    showScrollbar.value = false
    thumbWidth.value = 0
    thumbOffset.value = 0
    return
  }

  showScrollbar.value = true
  const trackWidth = track.clientWidth
  const visibleRatio = container.clientWidth / container.scrollWidth
  const nextThumbWidth = Math.max(56, Math.min(trackWidth, trackWidth * visibleRatio))
  const maxOffset = Math.max(0, trackWidth - nextThumbWidth)
  const nextThumbOffset = maxOffset === 0 ? 0 : (container.scrollLeft / maxScroll) * maxOffset

  thumbWidth.value = nextThumbWidth
  thumbOffset.value = nextThumbOffset
}

const syncScrollFromThumbOffset = (nextOffset: number) => {
  const container = tabsRef.value
  const track = trackRef.value
  if (!container || !track) return

  const maxScroll = container.scrollWidth - container.clientWidth
  if (maxScroll <= 0) {
    container.scrollLeft = 0
    return
  }

  const maxOffset = Math.max(0, track.clientWidth - thumbWidth.value)
  const clampedOffset = Math.min(Math.max(0, nextOffset), maxOffset)
  thumbOffset.value = clampedOffset
  container.scrollLeft = maxOffset === 0 ? 0 : (clampedOffset / maxOffset) * maxScroll
}

const updateIndicator = async () => {
  await nextTick()

  const container = tabsRef.value
  const activeTab = tabRefs.value[props.selectedCityName]
  if (!container || !activeTab) {
    indicatorStyle.value = {
      width: '0px',
      transform: 'translate3d(0, 0, 0)',
      opacity: '0',
    }
    syncScrollbarFromScroll()
    return
  }

  indicatorStyle.value = {
    width: `${activeTab.offsetWidth}px`,
    transform: `translate3d(${activeTab.offsetLeft}px, 0, 0)`,
    opacity: '1',
  }

  activeTab.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    inline: 'center',
    block: 'nearest',
  })

  window.requestAnimationFrame(syncScrollbarFromScroll)
}

const stopScrollbarDrag = () => {
  if (!isScrollbarDragging.value) return
  isScrollbarDragging.value = false
  window.removeEventListener('pointermove', handleWindowPointerMove)
  window.removeEventListener('pointerup', stopScrollbarDrag)
  window.removeEventListener('pointercancel', stopScrollbarDrag)
}

const handleWindowPointerMove = (event: PointerEvent) => {
  if (!isScrollbarDragging.value) return
  syncScrollFromThumbOffset(dragStartOffset + (event.clientX - dragStartX))
}

const startScrollbarDrag = (event: PointerEvent) => {
  dragStartX = event.clientX
  dragStartOffset = thumbOffset.value
  isScrollbarDragging.value = true
  window.addEventListener('pointermove', handleWindowPointerMove)
  window.addEventListener('pointerup', stopScrollbarDrag)
  window.addEventListener('pointercancel', stopScrollbarDrag)
}

const handleThumbPointerDown = (event: PointerEvent) => {
  event.preventDefault()
  startScrollbarDrag(event)
}

const handleTrackPointerDown = (event: PointerEvent) => {
  if (event.target !== trackRef.value) return

  const track = trackRef.value
  if (!track) return

  const rect = track.getBoundingClientRect()
  const nextOffset = event.clientX - rect.left - thumbWidth.value / 2
  syncScrollFromThumbOffset(nextOffset)
  startScrollbarDrag(event)
}

watch(() => props.selectedCityName, updateIndicator, { immediate: true })
watch(() => props.cities.map((city) => city.cityName).join('|'), updateIndicator)

onMounted(() => {
  updateIndicator()
  window.addEventListener('resize', updateIndicator)
})

onBeforeUnmount(() => {
  stopScrollbarDrag()
  window.removeEventListener('resize', updateIndicator)
})
</script>

<template>
  <section class="tabs-shell">
    <section ref="tabsRef" class="tabs" @scroll="syncScrollbarFromScroll">
      <span class="tab-indicator" :style="indicatorStyle" aria-hidden="true" />
      <button
        v-for="city in displayCities"
        :key="city.cityName"
        :ref="(el) => setTabRef(city.cityName, el as HTMLButtonElement | null)"
        type="button"
        class="tab"
        :class="{
          'is-default': city.displayCityName === displayDefaultCityName,
          'is-active': city.displayCityName === displaySelectedCityName,
        }"
        @click="emit('select', city.cityName)"
      >
        <span class="tab-city">{{ city.displayCityName }}</span>
        <span class="tab-meta">{{ city.weatherText }} · {{ city.temperature }}</span>
      </button>
    </section>

    <div v-show="showScrollbar" class="scrollbar-shell">
      <div ref="trackRef" class="scrollbar-track" @pointerdown="handleTrackPointerDown">
        <button
          type="button"
          class="scrollbar-thumb"
          :class="{ 'is-dragging': isScrollbarDragging }"
          :style="thumbStyle"
          aria-label="拖动城市列表滚动条"
          @pointerdown.stop="handleThumbPointerDown"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.tabs-shell {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.tabs {
  position: relative;
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  padding: 8px 0 8px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.scrollbar-shell {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding-top: 10px;
}

.scrollbar-track {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 10px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(117, 241, 255, 0.05), rgba(117, 241, 255, 0.1), rgba(255, 82, 205, 0.06)),
    rgba(3, 14, 34, 0.46);
  box-shadow:
    inset 0 1px 0 rgba(180, 252, 255, 0.06),
    inset 0 0 10px rgba(117, 241, 255, 0.04);
}

.scrollbar-thumb {
  position: absolute;
  left: 0;
  top: 0;
  height: 10px;
  border: 1px solid rgba(117, 241, 255, 0.34);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(143, 244, 255, 0.34), rgba(42, 128, 164, 0.78)),
    linear-gradient(90deg, rgba(0, 214, 255, 0.3), rgba(255, 82, 205, 0.16));
  box-shadow:
    inset 0 1px 0 rgba(214, 252, 255, 0.2),
    0 0 8px rgba(117, 241, 255, 0.2);
  cursor: none;
  transition: background var(--cyber-ease), box-shadow var(--cyber-ease), border-color var(--cyber-ease);
  touch-action: none;
}

.scrollbar-thumb:hover,
.scrollbar-thumb.is-dragging {
  border-color: rgba(117, 241, 255, 0.5);
  background:
    linear-gradient(180deg, rgba(164, 247, 255, 0.42), rgba(52, 143, 181, 0.88)),
    linear-gradient(90deg, rgba(0, 214, 255, 0.34), rgba(255, 82, 205, 0.2));
  box-shadow:
    inset 0 1px 0 rgba(229, 254, 255, 0.24),
    0 0 10px rgba(117, 241, 255, 0.26);
}

.tab-indicator {
  position: absolute;
  top: 8px;
  left: 0;
  height: calc(100% - 16px);
  border-radius: 16px;
  border: 1px solid rgba(117, 241, 255, 0.68);
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(0, 214, 255, 0.2), rgba(255, 0, 153, 0.1));
  box-shadow:
    inset 0 1px 0 rgba(180, 252, 255, 0.16),
    inset 0 0 18px rgba(117, 241, 255, 0.18),
    0 0 16px rgba(117, 241, 255, 0.24);
  pointer-events: none;
  transition:
    transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    width 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.18s ease;
  z-index: 0;
}

.tab {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  min-width: 160px;
  border: 1px solid rgba(117, 241, 255, 0.24);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.08), transparent 34%),
    rgba(8, 26, 56, 0.78);
  color: var(--cyber-text-muted);
  padding: 12px 16px;
  display: grid;
  gap: 6px;
  text-align: left;
  white-space: nowrap;
  transition:
    border-color var(--cyber-ease),
    color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    transform var(--cyber-ease),
    background var(--cyber-ease);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
}

.tab::before {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 12px;
  border: 1px solid rgba(117, 241, 255, 0.08);
  pointer-events: none;
}

.tab-city {
  color: var(--cyber-text);
  font-size: 14px;
  letter-spacing: 0.06em;
}

.tab-meta {
  color: rgba(183, 227, 242, 0.66);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.tab:hover {
  border-color: rgba(117, 241, 255, 0.5);
  color: var(--cyber-cyan);
  box-shadow: 0 0 10px rgba(117, 241, 255, 0.18);
  transform: translateY(-1px);
}

.tab.is-default {
  border-color: rgba(255, 210, 112, 0.78);
  box-shadow:
    inset 0 1px 0 rgba(255, 236, 190, 0.14),
    inset 0 0 18px rgba(255, 208, 102, 0.08),
    0 0 14px rgba(255, 196, 84, 0.16);
}

.tab.is-default::before {
  border-color: rgba(255, 215, 124, 0.2);
}

.tab.is-default .tab-city {
  color: #ffe9b5;
  text-shadow:
    0 0 8px rgba(255, 210, 112, 0.28),
    0 0 16px rgba(255, 181, 66, 0.14);
}

.tab.is-active {
  color: #effcff;
  box-shadow:
    inset 0 1px 0 rgba(196, 253, 255, 0.18),
    inset 0 0 18px rgba(117, 241, 255, 0.18),
    0 0 18px rgba(117, 241, 255, 0.18);
}

.tab.is-active .tab-city {
  color: #f4feff;
  text-shadow:
    0 0 8px rgba(117, 241, 255, 0.4),
    0 0 18px rgba(117, 241, 255, 0.22);
}

.tab.is-active .tab-meta {
  color: rgba(219, 248, 255, 0.76);
}

.tab.is-default.is-active {
  border-color: rgba(255, 224, 150, 0.96);
  box-shadow:
    inset 0 1px 0 rgba(255, 241, 210, 0.18),
    inset 0 0 22px rgba(255, 210, 112, 0.12),
    0 0 18px rgba(255, 196, 84, 0.18),
    0 0 20px rgba(117, 241, 255, 0.16);
}

@media (max-width: 640px) {
  .tabs {
    gap: 10px;
  }

  .tab {
    min-width: 146px;
    padding: 10px 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab,
  .tab-indicator {
    animation: none;
    transition: none;
  }
}
</style>
