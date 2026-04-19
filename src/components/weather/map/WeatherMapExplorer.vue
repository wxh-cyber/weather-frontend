<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import 'mars2d/mars2d.css'

import * as mars2d from 'mars2d'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createEcoBasemapLayer } from '@/components/weather/map/mapTheme'
import { getReverseGeocode } from '@/service/weather'

const MIN_ZOOM = 4
const MAX_ZOOM = 16
const DEFAULT_ZOOM = 9

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

const mapContainerRef = ref<HTMLElement | null>(null)
const mapReady = ref(false)
const mapError = ref('')
const currentZoom = ref(DEFAULT_ZOOM)
const lockedTargetPoint = ref<{ lat: number; lng: number } | null>(null)
const lockedTargetScreenPosition = ref<{ x: number; y: number } | null>(null)
const lockedTargetStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const lockedTargetPlaceName = ref('')

let mapInstance: mars2d.Map | null = null
let baseLayer: mars2d.layer.TileLayer | null = null
let cityMarker: mars2d.graphic.Marker | null = null
let lockedTargetRequestId = 0

const hasCoordinates = computed(
  () => Number.isFinite(props.latitude) && Number.isFinite(props.longitude),
)
const locationLabel = computed(() => {
  const segments = [props.cityName, props.province, props.country].filter(Boolean)
  return segments.join(' / ') || '城市定位信息同步中'
})
const coordinateLabel = computed(() => {
  if (!hasCoordinates.value) {
    return 'COORDINATES UNAVAILABLE'
  }

  return `${Number(props.longitude).toFixed(4)}E · ${Number(props.latitude).toFixed(4)}N`
})
const zoomPercent = computed(() => {
  const progress = ((currentZoom.value - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100
  return Math.round(Math.min(100, Math.max(0, progress)))
})
const note = computed(() => {
  if (!hasCoordinates.value) {
    return `${props.cityName}当前缺少可用地理坐标，地图页仍保留战术地图舱外观，待坐标恢复后会自动进入实时地图模式。`
  }

  if (lockedTargetPoint.value) {
    if (lockedTargetStatus.value === 'success' && lockedTargetPlaceName.value) {
      return `战术锁定已就位，当前目标位于 ${lockedTargetPlaceName.value}，继续点击地图可立即重置唯一准星。`
    }

    if (lockedTargetStatus.value === 'loading') {
      return '战术锁定已就位，正在解析目标地理名称，坐标锚点已经同步到地图视野中心。'
    }

    if (lockedTargetStatus.value === 'error') {
      return `当前位置名称解析失败，系统已回退显示坐标 ${lockedTargetPoint.value.lng.toFixed(4)}E · ${lockedTargetPoint.value.lat.toFixed(4)}N。`
    }

    return `战术锁定已就位，点击地图任意区域即可重新校准准星，当前锁定坐标为 ${lockedTargetPoint.value.lng.toFixed(4)}E · ${lockedTargetPoint.value.lat.toFixed(4)}N。`
  }

  return `${props.cityName}地图已接入在线底图与实时缩放控制，可拖动缩放条或使用两侧按键快速调整比例。`
})
const lockedTargetCoordinateLabel = computed(() => {
  if (!lockedTargetPoint.value) {
    return '点击地图任意位置，立即建立战术锁定。'
  }

  return `${lockedTargetPoint.value.lng.toFixed(4)}E · ${lockedTargetPoint.value.lat.toFixed(4)}N`
})
const lockedTargetDisplayName = computed(() => {
  if (!lockedTargetPoint.value) {
    return props.cityName
  }

  if (lockedTargetStatus.value === 'loading') {
    return '地点名称解析中...'
  }

  if (lockedTargetStatus.value === 'success' && lockedTargetPlaceName.value) {
    return lockedTargetPlaceName.value
  }

  if (lockedTargetStatus.value === 'error') {
    return '名称解析失败，已回退坐标'
  }

  return 'TACTICAL LOCK READY'
})

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom)))
const resolveMapErrorMessage = (error: unknown) =>
  error instanceof Error && error.message.trim()
    ? `地图加载失败：${error.message}`
    : '地图底图加载失败，请稍后重试'

const syncZoomState = () => {
  if (!mapInstance) {
    currentZoom.value = DEFAULT_ZOOM
    return
  }

  currentZoom.value = clampZoom(Number(mapInstance.getZoom()))
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

const syncLockedTargetScreenPosition = () => {
  if (!mapInstance || !lockedTargetPoint.value) {
    lockedTargetScreenPosition.value = null
    return
  }

  const point = mapInstance.latLngToContainerPoint?.(lockedTargetPoint.value as never)
  if (!point) {
    lockedTargetScreenPosition.value = null
    return
  }

  lockedTargetScreenPosition.value = {
    x: Number(point.x),
    y: Number(point.y),
  }
}

const resolveLockedTargetPlaceName = async (lat: number, lng: number) => {
  const requestId = ++lockedTargetRequestId
  lockedTargetStatus.value = 'loading'
  lockedTargetPlaceName.value = ''

  try {
    const response = await getReverseGeocode(lat, lng)
    if (requestId !== lockedTargetRequestId) {
      return
    }

    if (response.data.displayName) {
      lockedTargetPlaceName.value = response.data.displayName
      lockedTargetStatus.value = 'success'
      return
    }

    lockedTargetStatus.value = 'error'
  } catch {
    if (requestId !== lockedTargetRequestId) {
      return
    }

    lockedTargetStatus.value = 'error'
  }
}

const clearLockedTarget = () => {
  lockedTargetRequestId += 1
  lockedTargetPoint.value = null
  lockedTargetScreenPosition.value = null
  lockedTargetPlaceName.value = ''
  lockedTargetStatus.value = 'idle'
}

const handleZoomEnd = () => {
  syncZoomState()
  syncLockedTargetScreenPosition()
}

const handleBaseLayerTileError = (error: unknown) => {
  console.error('[WeatherMapExplorer] tile layer failed to load', error)
  mapError.value = '地图瓦片加载失败，请检查网络或稍后重试'
}

const handleMapMoveEnd = () => {
  syncLockedTargetScreenPosition()
}

const handleMapClick = (event: { latlng?: { lat?: number; lng?: number } } | undefined) => {
  const lat = Number(event?.latlng?.lat)
  const lng = Number(event?.latlng?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return
  }

  lockedTargetPoint.value = { lat, lng }
  syncLockedTargetScreenPosition()
  mapInstance?.setView({ lat, lng }, currentZoom.value, { animate: true })
  void resolveLockedTargetPlaceName(lat, lng)
}

const destroyMap = () => {
  mapInstance?.off?.('zoomend', handleZoomEnd)
  mapInstance?.off?.('moveend', handleMapMoveEnd)
  mapInstance?.off?.('click', handleMapClick)
  baseLayer?.off?.('tileerror', handleBaseLayerTileError)
  cityMarker?.remove()
  cityMarker = null
  baseLayer?.remove()
  baseLayer = null
  mapInstance?.destroy()
  mapInstance = null
  mapReady.value = false
  lockedTargetScreenPosition.value = null
}

const setMapZoom = (nextZoom: number) => {
  const targetZoom = clampZoom(nextZoom)
  currentZoom.value = targetZoom
  mapInstance?.setZoom(targetZoom, { animate: true })
}

const handleZoomSliderInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) {
    return
  }

  setMapZoom(Number(target.value))
}

const zoomIn = () => {
  setMapZoom(currentZoom.value + 1)
}

const zoomOut = () => {
  setMapZoom(currentZoom.value - 1)
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
        zoom: DEFAULT_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        dragging: true,
        keyboard: false,
        touchZoom: true,
        tap: true,
        copyright: false,
        basemaps: [],
        control: {
          scale: {
            position: 'topright',
            imperial: false,
            metric: true,
          },
        },
      })
      mapInstance.on('zoomend', handleZoomEnd)
      mapInstance.on('moveend', handleMapMoveEnd)
      mapInstance.on('click', handleMapClick)

      baseLayer = createEcoBasemapLayer()
      baseLayer.on?.('tileerror', handleBaseLayerTileError)
      baseLayer.addTo(mapInstance)
    }

    mapInstance.setView(center, currentZoom.value, { animate: true })
    syncMarker()
    syncLockedTargetScreenPosition()
    syncZoomState()
    mapReady.value = true
  } catch (error) {
    console.error('[WeatherMapExplorer] failed to initialize map', error)
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
    clearLockedTarget()
    void ensureMap()
  },
)

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<template>
  <section class="map-page" :data-map-ready="mapReady">
    <header class="map-page__head">
      <div>
        <p class="eyebrow">TACTICAL CITY MAP</p>
        <h2>{{ props.cityName }} 城市地图</h2>
        <p class="subline">{{ locationLabel }}</p>
      </div>
      <div class="head-status">
        <div class="status-chip" :class="{ 'is-offline': !hasCoordinates || !!mapError }">
          {{ hasCoordinates && !mapError ? 'MAP LINKED' : 'DEGRADED' }}
        </div>
        <div class="scale-frame" data-testid="map-scale-frame">
          <span class="scale-frame__label">SCALE LIVE</span>
        </div>
      </div>
    </header>

    <div class="map-shell">
      <div ref="mapContainerRef" class="map" data-testid="weather-map-explorer-canvas" />

      <div class="map-hud" aria-hidden="true">
        <span class="hud-corner hud-corner--lt" />
        <span class="hud-corner hud-corner--rt" />
        <span class="hud-corner hud-corner--lb" />
        <span class="hud-corner hud-corner--rb" />
        <div class="scanline" />
        <div v-if="hasCoordinates && !mapError && !lockedTargetPoint" class="map-pin" data-testid="map-center-pin">
          <span class="map-pin__pulse" />
          <span class="map-pin__core" />
        </div>
      </div>

      <div class="map-overlay">
        <div class="location-card">
          <span class="location-card__label">LOCKED TARGET</span>
          <strong class="location-card__value">{{ lockedTargetPoint ? 'TARGET LOCKED' : props.cityName }}</strong>
          <span class="location-card__meta">{{ lockedTargetPoint ? lockedTargetDisplayName : locationLabel }}</span>
          <span class="location-card__meta location-card__meta--secondary">
            {{ lockedTargetPoint ? lockedTargetCoordinateLabel : coordinateLabel }}
          </span>
        </div>

        <div class="zoom-console">
          <span class="zoom-console__label">ZOOM DRIVE</span>
          <div class="zoom-console__controls">
            <button type="button" class="zoom-btn" aria-label="缩小地图" @click="zoomOut">-</button>
            <input
              class="zoom-slider"
              type="range"
              :min="MIN_ZOOM"
              :max="MAX_ZOOM"
              :value="currentZoom"
              data-testid="map-zoom-slider"
              @input="handleZoomSliderInput"
            />
            <button type="button" class="zoom-btn" aria-label="放大地图" @click="zoomIn">+</button>
            <span class="zoom-percent" data-testid="map-zoom-percent">{{ zoomPercent }}%</span>
          </div>
        </div>
      </div>

      <div v-if="!hasCoordinates || mapError" class="map-fallback">
        <p class="map-fallback__title">{{ mapError || '城市坐标暂不可用' }}</p>
        <p class="map-fallback__text">当前地图页仍可保留完整赛博战术面板，待坐标恢复后会自动载入真实底图与比例尺。</p>
      </div>

      <div
        v-if="lockedTargetPoint && lockedTargetScreenPosition"
        class="target-lock"
        data-testid="map-target-lock"
        :style="{
          left: `${lockedTargetScreenPosition.x}px`,
          top: `${lockedTargetScreenPosition.y}px`,
        }"
        aria-live="polite"
      >
        <span class="target-lock__ring target-lock__ring--outer" />
        <span class="target-lock__ring target-lock__ring--inner" />
        <span class="target-lock__core" />
        <span class="target-lock__scan" />
        <div class="target-lock__label">
          <span class="target-lock__eyebrow">TARGET LOCKED</span>
          <strong>{{ lockedTargetDisplayName }}</strong>
          <span class="target-lock__coords">{{ lockedTargetCoordinateLabel }}</span>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-card">
        <span class="meta-card__label">LOCATION</span>
        <strong class="meta-card__value">{{ locationLabel }}</strong>
      </div>
      <div class="meta-card">
        <span class="meta-card__label">ZOOM RATIO</span>
        <strong class="meta-card__value">{{ zoomPercent }}%</strong>
      </div>
    </div>

    <p class="note">{{ note }}</p>
  </section>
</template>

<style scoped>
.map-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.map-page__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 18px 20px;
  border-radius: 18px;
  border: 1px solid rgba(117, 241, 255, 0.22);
  background:
    radial-gradient(circle at top left, rgba(117, 241, 255, 0.08), transparent 30%),
    linear-gradient(145deg, rgba(9, 28, 63, 0.88), rgba(4, 15, 38, 0.84));
  box-shadow:
    inset 0 1px 0 rgba(180, 252, 255, 0.08),
    inset 0 0 18px rgba(117, 241, 255, 0.08),
    var(--cyber-glow-md);
}

.eyebrow {
  margin: 0 0 8px;
  color: rgba(117, 241, 255, 0.62);
  font-size: 11px;
  letter-spacing: 0.22em;
}

h2 {
  margin: 0;
  color: var(--cyber-cyan);
  text-shadow: 0 0 12px rgba(117, 241, 255, 0.4);
}

.subline {
  margin: 8px 0 0;
  color: rgba(214, 242, 255, 0.72);
}

.head-status {
  display: grid;
  justify-items: end;
  gap: 10px;
}

.status-chip,
.scale-frame {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(3, 14, 36, 0.82);
  font-size: 11px;
  letter-spacing: 0.16em;
}

.status-chip {
  border: 1px solid rgba(117, 241, 255, 0.4);
  color: #9af5ff;
}

.status-chip.is-offline {
  border-color: rgba(255, 82, 205, 0.35);
  color: rgba(255, 208, 239, 0.88);
}

.scale-frame {
  border: 1px solid rgba(117, 241, 255, 0.22);
  color: rgba(214, 242, 255, 0.78);
}

.scale-frame__label {
  display: block;
}

.map-shell {
  position: relative;
  min-height: 540px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(117, 241, 255, 0.26);
  background:
    radial-gradient(circle at 18% 16%, rgba(117, 241, 255, 0.22), transparent 32%),
    linear-gradient(135deg, #20476a 0%, #133552 100%);
  box-shadow:
    inset 0 0 24px rgba(117, 241, 255, 0.08),
    var(--cyber-glow-md);
}

.map {
  width: 100%;
  min-height: 540px;
  filter: saturate(1.03) brightness(0.98) contrast(1);
}

.map-shell :deep(.leaflet-pane),
.map-shell :deep(.leaflet-layer),
.map-shell :deep(.leaflet-tile-container),
.map-shell :deep(.leaflet-marker-pane) {
  filter: saturate(1) brightness(1) contrast(1);
}

.map-shell :deep(.leaflet-control-scale) {
  margin: 18px 18px 0 0;
}

.map-shell :deep(.leaflet-control-scale-line) {
  border-color: rgba(117, 241, 255, 0.72);
  background: rgba(3, 14, 36, 0.82);
  color: rgba(234, 252, 255, 0.92);
  box-shadow: 0 0 12px rgba(117, 241, 255, 0.14);
}

.map-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.hud-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: rgba(117, 241, 255, 0.76);
  border-style: solid;
  filter: drop-shadow(0 0 10px rgba(117, 241, 255, 0.28));
}

.hud-corner--lt {
  top: 16px;
  left: 16px;
  border-width: 1px 0 0 1px;
}

.hud-corner--rt {
  top: 16px;
  right: 16px;
  border-width: 1px 1px 0 0;
}

.hud-corner--lb {
  left: 16px;
  bottom: 16px;
  border-width: 0 0 1px 1px;
}

.hud-corner--rb {
  right: 16px;
  bottom: 16px;
  border-width: 0 1px 1px 0;
}

.scanline {
  position: absolute;
  inset: -20% 0 auto;
  height: 72px;
  background: linear-gradient(180deg, rgba(117, 241, 255, 0), rgba(117, 241, 255, 0.16), rgba(117, 241, 255, 0));
  mix-blend-mode: screen;
  animation: map-scan 6s linear infinite;
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
  width: 62px;
  height: 62px;
  border: 1px solid rgba(117, 241, 255, 0.48);
  box-shadow: 0 0 24px rgba(117, 241, 255, 0.24);
  animation: map-pulse 2.1s ease-in-out infinite;
}

.map-pin__core {
  width: 14px;
  height: 14px;
  background: radial-gradient(circle, #f7fdff 0%, #75f1ff 55%, rgba(117, 241, 255, 0.18) 100%);
  box-shadow:
    0 0 14px rgba(117, 241, 255, 0.72),
    0 0 28px rgba(255, 82, 205, 0.22);
}

.map-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px;
  pointer-events: none;
  z-index: 3;
}

.target-lock {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 4;
  transform: translate(-50%, -50%);
}

.target-lock__ring,
.target-lock__core,
.target-lock__scan {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.target-lock__ring--outer {
  width: 96px;
  height: 96px;
  border: 1px solid rgba(117, 241, 255, 0.34);
  box-shadow:
    0 0 24px rgba(117, 241, 255, 0.16),
    inset 0 0 20px rgba(117, 241, 255, 0.08);
}

.target-lock__ring--inner {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(199, 251, 255, 0.86);
  box-shadow: 0 0 16px rgba(117, 241, 255, 0.28);
  animation: target-lock-pulse 1.9s ease-in-out infinite;
}

.target-lock__core {
  width: 10px;
  height: 10px;
  background: radial-gradient(circle, #f7fdff 0%, #75f1ff 68%, rgba(117, 241, 255, 0.08) 100%);
  box-shadow:
    0 0 14px rgba(117, 241, 255, 0.88),
    0 0 26px rgba(255, 82, 205, 0.22);
}

.target-lock__scan {
  width: 132px;
  height: 132px;
  border: 1px dashed rgba(117, 241, 255, 0.18);
  clip-path: polygon(50% 50%, 100% 42%, 100% 58%);
  animation: target-lock-sweep 2.4s linear infinite;
}

.target-lock__label {
  position: absolute;
  left: 24px;
  top: 22px;
  min-width: 190px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(117, 241, 255, 0.24);
  background:
    linear-gradient(135deg, rgba(7, 25, 58, 0.92), rgba(3, 14, 36, 0.88)),
    rgba(4, 16, 38, 0.9);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.06),
    0 0 20px rgba(117, 241, 255, 0.12);
  backdrop-filter: blur(8px);
}

.target-lock__eyebrow {
  display: block;
  margin-bottom: 6px;
  color: rgba(117, 241, 255, 0.58);
  font-size: 10px;
  letter-spacing: 0.22em;
}

.target-lock__label strong {
  display: block;
  color: rgba(242, 252, 255, 0.95);
  font-size: 12px;
  line-height: 1.5;
  letter-spacing: 0.08em;
}

.target-lock__coords {
  display: block;
  margin-top: 6px;
  color: rgba(195, 234, 255, 0.72);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.location-card,
.zoom-console {
  width: fit-content;
  max-width: min(100%, 420px);
  border-radius: 16px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  background: rgba(3, 14, 36, 0.72);
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.06),
    0 0 18px rgba(117, 241, 255, 0.08);
  backdrop-filter: blur(6px);
}

.location-card {
  padding: 12px 14px;
}

.location-card__label,
.zoom-console__label {
  display: block;
  color: rgba(117, 241, 255, 0.58);
  font-size: 10px;
  letter-spacing: 0.22em;
}

.location-card__value {
  display: block;
  margin-top: 8px;
  color: rgba(242, 252, 255, 0.96);
  font-size: 18px;
}

.location-card__meta {
  display: block;
  margin-top: 6px;
  color: rgba(214, 242, 255, 0.7);
  font-size: 12px;
}

.location-card__meta--secondary {
  color: rgba(168, 220, 248, 0.62);
}

.zoom-console {
  pointer-events: auto;
  align-self: flex-end;
  padding: 14px 16px;
}

.zoom-console__controls {
  display: grid;
  grid-template-columns: auto minmax(180px, 260px) auto auto;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.zoom-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(117, 241, 255, 0.24);
  background:
    linear-gradient(135deg, rgba(117, 241, 255, 0.18), rgba(255, 82, 205, 0.16)),
    rgba(3, 14, 36, 0.88);
  color: var(--cyber-cyan);
  font-size: 18px;
  cursor: pointer;
}

.zoom-slider {
  width: 100%;
  accent-color: #75f1ff;
}

.zoom-percent {
  min-width: 48px;
  color: rgba(242, 252, 255, 0.94);
  font-size: 16px;
  text-align: right;
}

.map-fallback {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  align-content: center;
  gap: 12px;
  padding: 28px;
  background:
    radial-gradient(circle at center, rgba(117, 241, 255, 0.12), transparent 38%),
    linear-gradient(180deg, rgba(5, 16, 36, 0.7), rgba(3, 10, 24, 0.92));
  text-align: center;
}

.map-fallback__title {
  margin: 0;
  color: var(--cyber-cyan);
  font-size: 18px;
}

.map-fallback__text {
  margin: 0 auto;
  max-width: 560px;
  color: rgba(214, 242, 255, 0.74);
  line-height: 1.7;
}

.meta-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.meta-card {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(117, 241, 255, 0.14);
  background: rgba(4, 18, 42, 0.42);
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
  font-size: 14px;
  line-height: 1.5;
}

.note {
  margin: 0;
  color: var(--cyber-text-muted);
  line-height: 1.8;
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

@keyframes target-lock-pulse {
  0%,
  100% {
    opacity: 0.48;
    transform: translate(-50%, -50%) scale(0.92);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.06);
  }
}

@keyframes target-lock-sweep {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    opacity: 0.72;
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
    opacity: 0.3;
  }
}

@media (max-width: 900px) {
  .map-page__head {
    flex-direction: column;
  }

  .head-status {
    justify-items: start;
  }

  .map-shell,
  .map {
    min-height: 460px;
  }

  .map-overlay {
    padding: 14px;
  }

  .zoom-console {
    width: 100%;
  }

  .zoom-console__controls {
    grid-template-columns: auto 1fr auto auto;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .map-shell,
  .map {
    min-height: 400px;
  }

  .zoom-console__controls {
    grid-template-columns: auto 1fr auto;
  }

  .zoom-percent {
    grid-column: 1 / -1;
    text-align: left;
  }

  .target-lock__label {
    left: -20px;
    top: 58px;
    min-width: 168px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scanline,
  .map-pin__pulse,
  .target-lock__ring--inner,
  .target-lock__scan {
    animation: none;
  }
}
</style>
