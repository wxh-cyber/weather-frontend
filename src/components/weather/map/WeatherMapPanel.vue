<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import 'mars2d/mars2d.css'

import * as mars2d from 'mars2d'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createEcoBasemapLayer } from '@/components/weather/map/mapTheme'

const props = withDefaults(
  defineProps<{
    cityName?: string
    weatherText?: string
    province?: string
    country?: string
    latitude?: number | null
    longitude?: number | null
  }>(),
  {
    cityName: '默认城市',
    weatherText: '多云',
    province: '',
    country: '中国',
    latitude: null,
    longitude: null,
  },
)

const router = useRouter()
const mapContainerRef = ref<HTMLElement | null>(null)
const mapReady = ref(false)
const mapError = ref('')
let mapInstance: mars2d.Map | null = null
let baseLayer: mars2d.layer.TileLayer | null = null
let cityMarker: mars2d.graphic.Marker | null = null

const hasCoordinates = computed(
  () => Number.isFinite(props.latitude) && Number.isFinite(props.longitude),
)
const coordinateLabel = computed(() => {
  if (!hasCoordinates.value) {
    return 'COORDINATES UNAVAILABLE'
  }
  return `${Number(props.longitude).toFixed(4)}E · ${Number(props.latitude).toFixed(4)}N`
})
const locationLabel = computed(() => {
  const segments = [props.cityName, props.province, props.country].filter(Boolean)
  return segments.join(' / ') || '城市定位信息同步中'
})
const canNavigate = computed(() => Boolean(props.cityName?.trim()))
const note = computed(() => {
  if (!hasCoordinates.value) {
    return `${props.cityName}当前缺少可用地理坐标，地图面板暂时无法锁定城市位置。`
  }
  if (props.weatherText.includes('雨')) return `${props.cityName}未来 2 小时存在短时降水波动，请关注雷达回波与城区积水变化。`
  if (props.weatherText.includes('雪')) return `${props.cityName}上空云层较厚，地图已锁定当前城区位置，可结合路况关注降雪增强。`
  if (props.weatherText.includes('晴')) return `${props.cityName}当前云层较少，地图已锁定城区位置，至少 2 小时内无明显降水信号。`
  return `${props.cityName}云层活动平稳，地图已锁定当前城市位置，可用于快速核对地理方位。`
})
const resolveMapErrorMessage = (error: unknown) =>
  error instanceof Error && error.message.trim()
    ? `地图加载失败：${error.message}`
    : '地图底图加载失败，请稍后重试'

const navigateToMapView = () => {
  const cityName = props.cityName.trim()
  if (!cityName) {
    return
  }

  void router.push({
    name: 'city-weather-map',
    params: { cityName },
  })
}

const handleBaseLayerTileError = (error: unknown) => {
  console.error('[WeatherMapPanel] tile layer failed to load', error)
  mapError.value = '地图瓦片加载失败，请检查网络或稍后重试'
}

const destroyMap = () => {
  baseLayer?.off?.('tileerror', handleBaseLayerTileError)
  cityMarker?.remove()
  cityMarker = null
  baseLayer?.remove()
  baseLayer = null
  mapInstance?.destroy()
  mapInstance = null
  mapReady.value = false
}

const syncMarker = () => {
  if (!mapInstance || !hasCoordinates.value) {
    return
  }

  const latlng = [Number(props.latitude), Number(props.longitude)]
  if (!cityMarker) {
    cityMarker = new mars2d.graphic.Marker({
      latlng,
      tooltip: `${props.cityName} · 城市定位`,
    })
    mapInstance.graphicLayer.addGraphic(cityMarker)
    return
  }

  cityMarker.setLatLng(latlng)
  cityMarker.setTooltipContent?.(`${props.cityName} · 城市定位`)
}

const ensureMap = async () => {
  if (!hasCoordinates.value) {
    destroyMap()
    mapError.value = ''
    return
  }

  await nextTick()
  if (!mapContainerRef.value) {
    return
  }

  mapError.value = ''

  try {
    const center = {
      lat: Number(props.latitude),
      lng: Number(props.longitude),
    }
    if (!mapInstance) {
      mapInstance = new mars2d.Map(mapContainerRef.value, {
        center,
        zoom: 9,
        minZoom: 4,
        maxZoom: 18,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        dragging: false,
        keyboard: false,
        touchZoom: false,
        tap: false,
        copyright: false,
        basemaps: [],
      })
      baseLayer = createEcoBasemapLayer()
      baseLayer.on?.('tileerror', handleBaseLayerTileError)
      baseLayer.addTo(mapInstance)
    }

    mapInstance.setView(center, 9, { animate: true })
    syncMarker()
    mapReady.value = true
  } catch (error) {
    console.error('[WeatherMapPanel] failed to initialize map', error)
    destroyMap()
    mapError.value = resolveMapErrorMessage(error)
  }
}

onMounted(() => {
  void ensureMap()
})

watch(
  () => [props.latitude, props.longitude, props.cityName] as const,
  () => {
    void ensureMap()
  },
)

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<template>
  <article
    class="panel panel--interactive"
    :data-map-ready="mapReady"
    :tabindex="canNavigate ? 0 : -1"
    role="button"
    aria-label="打开城市地图详情"
    @click="navigateToMapView"
    @keydown.enter.prevent="navigateToMapView"
    @keydown.space.prevent="navigateToMapView"
  >
    <div class="panel-head">
      <div>
        <p class="eyebrow">CITY GEO-LOCK</p>
        <h3>{{ props.cityName }}天气地图</h3>
      </div>
      <div class="panel-actions">
        <div class="status-chip" :class="{ 'is-offline': !hasCoordinates || !!mapError }">
          {{ hasCoordinates && !mapError ? 'ONLINE' : 'DEGRADED' }}
        </div>
        <div class="enter-chip">
          ENTER MAP
        </div>
      </div>
    </div>

    <div class="map-shell">
      <div ref="mapContainerRef" class="map" data-testid="weather-map-canvas" />
      <div class="map-hud" aria-hidden="true">
        <span class="hud-corner hud-corner--lt" />
        <span class="hud-corner hud-corner--rt" />
        <span class="hud-corner hud-corner--lb" />
        <span class="hud-corner hud-corner--rb" />
        <div class="scanline" />
        <div v-if="hasCoordinates && !mapError" class="map-pin">
          <span class="map-pin__pulse" />
          <span class="map-pin__core" />
        </div>
      </div>
      <div v-if="!hasCoordinates || mapError" class="map-fallback">
        <p class="map-fallback__title">{{ mapError || '城市坐标暂不可用' }}</p>
        <p class="map-fallback__text">当前面板仍保留赛博地图舱外观，待坐标同步后会自动恢复实时地图。</p>
      </div>
    </div>

    <div class="map-meta">
      <div class="meta-card">
        <span class="meta-card__label">LOCATION</span>
        <strong class="meta-card__value">{{ locationLabel }}</strong>
      </div>
      <div class="meta-card">
        <span class="meta-card__label">COORD</span>
        <strong class="meta-card__value">{{ coordinateLabel }}</strong>
      </div>
    </div>

    <p class="note">{{ note }}</p>
  </article>
</template>

<style scoped>
.panel {
  position: relative;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background: linear-gradient(160deg, rgba(16, 40, 78, 0.86), rgba(8, 24, 52, 0.84));
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.08),
    var(--cyber-glow-sm);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
  overflow: hidden;
}

.panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(117, 241, 255, 0.04), transparent 30%),
    radial-gradient(circle at top right, rgba(255, 82, 205, 0.12), transparent 26%);
  pointer-events: none;
}

.panel--interactive {
  cursor: pointer;
  transition:
    transform var(--cyber-ease),
    box-shadow var(--cyber-ease),
    border-color var(--cyber-ease);
}

.panel--interactive:hover,
.panel--interactive:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(117, 241, 255, 0.42);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.08),
    0 0 24px rgba(117, 241, 255, 0.12),
    var(--cyber-glow-sm);
  outline: none;
}

.panel-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-actions {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.eyebrow {
  margin: 0 0 6px;
  color: rgba(117, 241, 255, 0.62);
  font-size: 11px;
  letter-spacing: 0.22em;
}

h3 {
  margin: 0;
  color: var(--cyber-cyan);
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.45);
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
}

.status-chip {
  flex: 0 0 auto;
  padding: 6px 10px;
  border: 1px solid rgba(117, 241, 255, 0.4);
  border-radius: 999px;
  background: rgba(4, 18, 42, 0.82);
  color: #9af5ff;
  font-size: 11px;
  letter-spacing: 0.16em;
  box-shadow: inset 0 0 12px rgba(117, 241, 255, 0.12);
}

.status-chip.is-offline {
  border-color: rgba(255, 82, 205, 0.35);
  color: rgba(255, 208, 239, 0.88);
}

.enter-chip {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(2, 10, 26, 0.72);
  color: rgba(214, 242, 255, 0.82);
  font-size: 10px;
  letter-spacing: 0.18em;
}

.map-shell {
  position: relative;
  margin-top: 14px;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(117, 241, 255, 0.28);
  background:
    radial-gradient(circle at 20% 18%, rgba(117, 241, 255, 0.2), transparent 34%),
    linear-gradient(135deg, #1c405f 0%, #102844 100%);
}

.map {
  height: 220px;
  width: 100%;
  filter: saturate(1.03) brightness(0.98) contrast(1);
}

.map-shell :deep(.leaflet-control-container) {
  display: none;
}

.map-shell :deep(.leaflet-pane),
.map-shell :deep(.leaflet-layer),
.map-shell :deep(.leaflet-tile-container),
.map-shell :deep(.leaflet-marker-pane) {
  filter: saturate(1) brightness(1) contrast(1);
}

.map-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.hud-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: rgba(117, 241, 255, 0.75);
  border-style: solid;
  filter: drop-shadow(0 0 10px rgba(117, 241, 255, 0.35));
}

.hud-corner--lt {
  top: 10px;
  left: 10px;
  border-width: 1px 0 0 1px;
}

.hud-corner--rt {
  top: 10px;
  right: 10px;
  border-width: 1px 1px 0 0;
}

.hud-corner--lb {
  left: 10px;
  bottom: 10px;
  border-width: 0 0 1px 1px;
}

.hud-corner--rb {
  right: 10px;
  bottom: 10px;
  border-width: 0 1px 1px 0;
}

.scanline {
  position: absolute;
  inset: -30% 0 auto;
  height: 56px;
  background: linear-gradient(180deg, rgba(117, 241, 255, 0), rgba(117, 241, 255, 0.18), rgba(117, 241, 255, 0));
  mix-blend-mode: screen;
  animation: map-scan 5.2s linear infinite;
}

.map-pin {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.map-pin__pulse,
.map-pin__core {
  position: absolute;
  inset: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.map-pin__pulse {
  width: 54px;
  height: 54px;
  border: 1px solid rgba(117, 241, 255, 0.48);
  box-shadow: 0 0 20px rgba(117, 241, 255, 0.25);
  animation: map-pulse 2.2s ease-in-out infinite;
}

.map-pin__core {
  width: 12px;
  height: 12px;
  background: radial-gradient(circle, #f7fdff 0%, #75f1ff 55%, rgba(117, 241, 255, 0.2) 100%);
  box-shadow:
    0 0 14px rgba(117, 241, 255, 0.72),
    0 0 28px rgba(255, 82, 205, 0.28);
}

.map-fallback {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  align-content: center;
  gap: 10px;
  padding: 26px;
  background:
    radial-gradient(circle at center, rgba(117, 241, 255, 0.12), transparent 38%),
    linear-gradient(180deg, rgba(5, 16, 36, 0.66), rgba(3, 10, 24, 0.9));
  text-align: center;
}

.map-fallback__title {
  margin: 0;
  color: var(--cyber-cyan);
  font-size: 16px;
}

.map-fallback__text {
  margin: 0;
  color: rgba(214, 242, 255, 0.72);
  line-height: 1.7;
}

.map-meta {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.meta-card {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(117, 241, 255, 0.14);
  background: rgba(4, 18, 42, 0.4);
  box-shadow: inset 0 0 16px rgba(117, 241, 255, 0.05);
}

.meta-card__label {
  display: block;
  color: rgba(117, 241, 255, 0.56);
  font-size: 10px;
  letter-spacing: 0.2em;
}

.meta-card__value {
  display: block;
  margin-top: 6px;
  color: rgba(234, 252, 255, 0.92);
  font-size: 13px;
  line-height: 1.5;
}

.note {
  margin-top: 12px;
  color: var(--cyber-text-muted);
  position: relative;
  z-index: 1;
  line-height: 1.7;
}

@keyframes map-scan {
  0% {
    transform: translateY(-140%);
  }
  100% {
    transform: translateY(420%);
  }
}

@keyframes map-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: translate(-50%, -50%) scale(0.88);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.08);
  }
}

@media (max-width: 640px) {
  .map-meta {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  h3,
  .scanline,
  .map-pin__pulse {
    animation: none;
  }
}
</style>
