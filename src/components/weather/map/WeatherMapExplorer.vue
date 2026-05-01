<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import 'mars2d/mars2d.css'

import * as mars2d from 'mars2d'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import cloudIcon from '@/assets/icons/map/云图.svg'
import windIcon from '@/assets/icons/map/风向图.svg'
import precipitationIcon from '@/assets/icons/map/降水.svg'
import { createEcoBasemapLayer } from '@/components/weather/map/mapTheme'
import { getReverseGeocode } from '@/service/weather'

const MIN_ZOOM = 4
const MAX_ZOOM = 16
const DEFAULT_ZOOM = 9

type WeatherOverlayMode = 'none' | 'precipitation' | 'cloud' | 'wind'
type WeatherLegendItem = {
  label: string
  color: string
  glowColor?: string
}
type OverlayRegionSeed = {
  id: string
  anchorLatOffset: number
  anchorLngOffset: number
  radiusLat: number
  radiusLng: number
  wobble: number
}
type OverlayRegion = {
  id: string
  color: string
  accentColor: string
  hazeColor: string
  streakColor: string
  intensity: string
  legendGradient: string
  path: string
  innerPath: string
  haloPath: string
  glowPath: string
  texturePath: string
  labelX: number
  labelY: number
  windDirection: string | null
  windLevel: string | null
  windFlowPath: string | null
  isTyphoon: boolean
}

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
const overlayMode = ref<WeatherOverlayMode>('none')
const hoverPreviewMode = ref<Exclude<WeatherOverlayMode, 'none'> | null>(null)
const overlayProjectionTick = ref(0)
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
const weatherOverlayOptions: ReadonlyArray<{
  key: Exclude<WeatherOverlayMode, 'none'>
  label: string
  iconSrc: string
}> = [
  { key: 'precipitation', label: '降水图', iconSrc: precipitationIcon },
  { key: 'cloud', label: '云图', iconSrc: cloudIcon },
  { key: 'wind', label: '风向图', iconSrc: windIcon },
]
const precipitationLegend = computed<WeatherLegendItem[]>(() => [
  { label: '0-2mm', color: '#59d7ff', glowColor: '#8be8ff' },
  { label: '2-8mm', color: '#22a6ff', glowColor: '#59c3ff' },
  { label: '8-16mm', color: '#7b7dff', glowColor: '#9b9eff' },
  { label: '16-30mm', color: '#d365ff', glowColor: '#ed97ff' },
  { label: '30mm+', color: '#ff6b8f', glowColor: '#ff98af' },
])
const cloudLegend = computed<WeatherLegendItem[]>(() => [
  { label: '0-20%', color: '#8ce6ff', glowColor: '#b1eeff' },
  { label: '20-40%', color: '#5ebdf7', glowColor: '#8fd5ff' },
  { label: '40-60%', color: '#5f85ff', glowColor: '#8ca6ff' },
  { label: '60-80%', color: '#8d79ff', glowColor: '#b39eff' },
  { label: '80-100%', color: '#d7dbff', glowColor: '#eef1ff' },
])
const windLegend = computed<WeatherLegendItem[]>(() => [
  { label: '0-2级', color: '#6ef0ff', glowColor: '#a2f7ff' },
  { label: '3-4级', color: '#39c8ff', glowColor: '#79dcff' },
  { label: '5-6级', color: '#5d8fff', glowColor: '#8eb0ff' },
  { label: '7-8级', color: '#b06cff', glowColor: '#cd99ff' },
  { label: '9级+', color: '#ff6e8a', glowColor: '#ffa3b4' },
])
const activeLegend = computed(() => {
  if (overlayMode.value === 'precipitation') {
    return precipitationLegend.value
  }

  if (overlayMode.value === 'cloud') {
    return cloudLegend.value
  }

  if (overlayMode.value === 'wind') {
    return windLegend.value
  }

  return hoverPreviewMode.value === 'precipitation'
    ? precipitationLegend.value
    : hoverPreviewMode.value === 'cloud'
      ? cloudLegend.value
      : hoverPreviewMode.value === 'wind'
        ? windLegend.value
      : []
})
const previewTitle = computed(() => {
  if (overlayMode.value === 'precipitation' || hoverPreviewMode.value === 'precipitation') {
    return 'PRECIPITATION SCAN'
  }

  if (overlayMode.value === 'cloud' || hoverPreviewMode.value === 'cloud') {
    return 'CLOUD DENSITY SCAN'
  }

  if (overlayMode.value === 'wind' || hoverPreviewMode.value === 'wind') {
    return 'WIND FIELD SCAN'
  }

  return ''
})
const activeLegendGradient = computed(() => {
  if (!activeLegend.value.length) {
    return ''
  }

  const stops = activeLegend.value.map((item, index) => {
    const position = activeLegend.value.length === 1 ? 100 : (index / (activeLegend.value.length - 1)) * 100
    return `${item.color} ${position.toFixed(2)}%`
  })
  return `linear-gradient(90deg, ${stops.join(', ')})`
})
const visibleOverlayMode = computed<WeatherOverlayMode>(() => {
  if (overlayMode.value !== 'none') {
    return overlayMode.value
  }

  return hoverPreviewMode.value ?? 'none'
})
const activeWindDirection = computed(() => {
  if (visibleOverlayMode.value !== 'wind' || !hasCoordinates.value) {
    return ''
  }

  const seed = Array.from(props.cityName).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const directions = [
    '北风 / North Drift',
    '东北风 / Northeast Flow',
    '东风 / East Sweep',
    '东南风 / Southeast Stream',
    '南风 / South Pulse',
    '西南风 / Southwest Flow',
    '西风 / West Current',
    '西北风 / Northwest Shear',
  ] as const
  return directions[seed % directions.length] ?? directions[0]
})
const globalWindFlowPath = computed(() => {
  if (visibleOverlayMode.value !== 'wind') {
    return ''
  }

  const seed = Array.from(props.cityName).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const baseAngle = ((seed * 13) % 360) * (Math.PI / 180)
  const lanes = [140, 265, 390, 515, 640, 765, 890]

  return lanes.map((startY, laneIndex) => {
    const phase = seed * 0.027 + laneIndex * 0.61
    const startX = -90
    const controlX1 = 210 + Math.sin(phase) * 36
    const controlY1 = startY + Math.cos(phase * 1.2) * 28
    const controlX2 = 560 + Math.sin(phase * 0.8 + 0.4) * 44
    const controlY2 = startY + Math.sin(phase * 1.4) * 34
    const endX = 1120
    const endY = startY + Math.cos(phase * 0.92) * 30
    const arrowLength = 16 + laneIndex * 0.4
    const arrowX1 = endX - Math.cos(baseAngle - 0.46) * arrowLength
    const arrowY1 = endY - Math.sin(baseAngle - 0.46) * arrowLength
    const arrowX2 = endX - Math.cos(baseAngle + 0.46) * arrowLength
    const arrowY2 = endY - Math.sin(baseAngle + 0.46) * arrowLength
    return [
      `M ${startX.toFixed(2)} ${startY.toFixed(2)}`,
      `C ${controlX1.toFixed(2)} ${controlY1.toFixed(2)} ${controlX2.toFixed(2)} ${controlY2.toFixed(2)} ${endX.toFixed(2)} ${endY.toFixed(2)}`,
      `M ${arrowX1.toFixed(2)} ${arrowY1.toFixed(2)} L ${endX.toFixed(2)} ${endY.toFixed(2)} L ${arrowX2.toFixed(2)} ${arrowY2.toFixed(2)}`,
    ].join(' ')
  }).join(' ')
})
const invalidateOverlayProjection = () => {
  overlayProjectionTick.value += 1
}
const mixHexColor = (baseColor: string, targetColor: string, ratio: number) => {
  const normalizedBase = baseColor.replace('#', '')
  const normalizedTarget = targetColor.replace('#', '')
  const base = normalizedBase.length === 3
    ? normalizedBase.split('').map((char) => `${char}${char}`).join('')
    : normalizedBase
  const target = normalizedTarget.length === 3
    ? normalizedTarget.split('').map((char) => `${char}${char}`).join('')
    : normalizedTarget

  const clampRatio = Math.min(1, Math.max(0, ratio))
  const readChannel = (value: string, start: number) => Number.parseInt(value.slice(start, start + 2), 16)
  const blendChannel = (start: number) => {
    const source = readChannel(base, start)
    const targetValue = readChannel(target, start)
    return Math.round(source + (targetValue - source) * clampRatio)
      .toString(16)
      .padStart(2, '0')
  }

  return `#${blendChannel(0)}${blendChannel(2)}${blendChannel(4)}`
}
const overlayRegions = computed<OverlayRegion[]>(() => {
  overlayProjectionTick.value
  const mode = visibleOverlayMode.value
  if (mode === 'none' || !mapInstance || !hasCoordinates.value) {
    return []
  }

  const seed = Array.from(props.cityName).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const palette = mode === 'precipitation'
    ? precipitationLegend.value
    : mode === 'cloud'
      ? cloudLegend.value
      : windLegend.value
  const regionSeeds: OverlayRegionSeed[] = [
    { id: 'northwest', anchorLatOffset: 0.26, anchorLngOffset: -0.34, radiusLat: 0.18, radiusLng: 0.26, wobble: 0.18 },
    { id: 'east', anchorLatOffset: 0.08, anchorLngOffset: 0.42, radiusLat: 0.2, radiusLng: 0.28, wobble: 0.14 },
    { id: 'southwest', anchorLatOffset: -0.22, anchorLngOffset: -0.24, radiusLat: 0.16, radiusLng: 0.22, wobble: 0.22 },
    { id: 'southeast', anchorLatOffset: -0.3, anchorLngOffset: 0.3, radiusLat: 0.18, radiusLng: 0.26, wobble: 0.16 },
  ]

  const toPoint = (lat: number, lng: number) => {
    const point = mapInstance?.latLngToContainerPoint?.({ lat, lng } as never)
    if (!point) {
      return null
    }

    return {
      x: Number(point.x),
      y: Number(point.y),
    }
  }

  const centerLat = Number(props.latitude)
  const centerLng = Number(props.longitude)

  return regionSeeds.flatMap((baseSeed, index) => {
    const legendItem = palette[(seed + index * (mode === 'precipitation' ? 3 : 5)) % palette.length] ?? palette[0]!
    const anchorLat = centerLat + baseSeed.anchorLatOffset
    const anchorLng = centerLng + baseSeed.anchorLngOffset

    const contourPoints = Array.from({ length: 7 }, (_, pointIndex) => {
      const angle = (Math.PI * 2 * pointIndex) / 7
      const wobbleFactor = 1 + Math.sin(seed * 0.07 + pointIndex * 1.37) * baseSeed.wobble
      const pointLat = anchorLat + Math.sin(angle) * baseSeed.radiusLat * wobbleFactor
      const pointLng = anchorLng + Math.cos(angle) * baseSeed.radiusLng * wobbleFactor
      return toPoint(pointLat, pointLng)
    })

    if (contourPoints.some((point) => !point)) {
      return []
    }

    const points = contourPoints as Array<{ x: number; y: number }>
    const centroid = points.reduce((acc, point) => ({
      x: acc.x + point.x / points.length,
      y: acc.y + point.y / points.length,
    }), { x: 0, y: 0 })
    const createClosedPath = (
      scale: number,
      variant = 0,
      lateralDrift = 0,
      axialDrift = 0,
      lobeBias = 0,
    ) => {
      const pivot = points[0]!
      const scaledPoints = points.map((point, pointIndex) => {
        const relativeX = point.x - pivot.x
        const relativeY = point.y - pivot.y
        const angle = Math.atan2(relativeY, relativeX)
        const driftSeed = seed * 0.013 + index * 0.77 + variant * 1.31 + pointIndex * 0.93
        const driftWave = Math.sin(driftSeed) * lateralDrift
        const driftLift = Math.cos(driftSeed * 1.18) * axialDrift
        const lobeWave = 1 + Math.sin(angle * 2 + driftSeed * 0.72) * lobeBias
        const edgeBias = mode === 'precipitation'
          ? 1 + Math.cos(angle * 3.2 + variant * 0.5) * 0.06
          : 1 + Math.sin(angle * 1.8 + variant * 0.64) * 0.04

        return {
          x: pivot.x + relativeX * scale * lobeWave * edgeBias + Math.cos(angle) * driftWave,
          y: pivot.y + relativeY * scale * lobeWave * edgeBias + Math.sin(angle) * driftLift,
        }
      })

      let path = `M ${scaledPoints[0]!.x.toFixed(2)} ${scaledPoints[0]!.y.toFixed(2)}`
      for (let pointIndex = 1; pointIndex < scaledPoints.length; pointIndex += 1) {
        const current = scaledPoints[pointIndex]!
        const previous = scaledPoints[pointIndex - 1]!
        const controlX = ((previous.x + current.x) / 2).toFixed(2)
        const controlY = ((previous.y + current.y) / 2).toFixed(2)
        path += ` Q ${previous.x.toFixed(2)} ${previous.y.toFixed(2)} ${controlX} ${controlY}`
      }

      const last = scaledPoints[scaledPoints.length - 1]!
      const first = scaledPoints[0]!
      const closingControlX = ((last.x + first.x) / 2).toFixed(2)
      const closingControlY = ((last.y + first.y) / 2).toFixed(2)
      return `${path} Q ${last.x.toFixed(2)} ${last.y.toFixed(2)} ${closingControlX} ${closingControlY} Z`
    }

    const createTexturePath = () => {
      const streakIndices = mode === 'precipitation'
        ? [1, 3, 5]
        : [0, 2, 4]
      const streakAnchors = streakIndices.map((pointIndex, streakIndex) => {
        const point = points[pointIndex]!
        const drift = Math.sin(seed * 0.019 + index * 0.81 + pointIndex * 0.67) * (mode === 'precipitation' ? 18 : 12)
        const settle = Math.cos(seed * 0.015 + streakIndex * 1.12) * (mode === 'precipitation' ? 10 : 16)
        return {
          x: point.x * (mode === 'precipitation' ? 0.84 : 0.82) + points[0]!.x * (mode === 'precipitation' ? 0.16 : 0.18) + drift,
          y: point.y * (mode === 'precipitation' ? 0.82 : 0.8) + points[0]!.y * (mode === 'precipitation' ? 0.18 : 0.2) + settle,
        }
      })

      const first = streakAnchors[0]!
      let path = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
      for (let streakIndex = 1; streakIndex < streakAnchors.length; streakIndex += 1) {
        const previous = streakAnchors[streakIndex - 1]!
        const current = streakAnchors[streakIndex]!
        const controlX = ((previous.x + current.x) / 2 + Math.sin(seed * 0.021 + streakIndex) * 12).toFixed(2)
        const controlY = ((previous.y + current.y) / 2 + Math.cos(seed * 0.017 + streakIndex) * 10).toFixed(2)
        path += ` Q ${previous.x.toFixed(2)} ${previous.y.toFixed(2)} ${controlX} ${controlY}`
      }

      return path
    }

    const createWindFlowPath = () => {
      const angle = ((seed + index * 19) % 360) * (Math.PI / 180)
      const segmentLength = 34 + index * 6
      const offsets = [-18, 0, 18]
      return offsets.map((offset, streakIndex) => {
        const startX = centroid.x - Math.cos(angle) * segmentLength + Math.sin(angle) * offset
        const startY = centroid.y - Math.sin(angle) * segmentLength - Math.cos(angle) * offset
        const midX = centroid.x + Math.sin(angle) * (offset * 0.55) + Math.cos(angle) * (segmentLength * 0.28)
        const midY = centroid.y - Math.cos(angle) * (offset * 0.55) + Math.sin(angle) * (segmentLength * 0.28)
        const endX = centroid.x + Math.cos(angle) * segmentLength + Math.sin(angle) * offset * 0.5
        const endY = centroid.y + Math.sin(angle) * segmentLength - Math.cos(angle) * offset * 0.5
        const arrowX = endX - Math.cos(angle - 0.42) * 14
        const arrowY = endY - Math.sin(angle - 0.42) * 14
        const arrowX2 = endX - Math.cos(angle + 0.42) * 14
        const arrowY2 = endY - Math.sin(angle + 0.42) * 14

        return [
          `M ${startX.toFixed(2)} ${startY.toFixed(2)}`,
          `Q ${midX.toFixed(2)} ${midY.toFixed(2)} ${endX.toFixed(2)} ${endY.toFixed(2)}`,
          `M ${arrowX.toFixed(2)} ${arrowY.toFixed(2)} L ${endX.toFixed(2)} ${endY.toFixed(2)} L ${arrowX2.toFixed(2)} ${arrowY2.toFixed(2)}`,
        ].join(' ')
      }).join(' ')
    }

    const windLevels = ['2级', '4级', '6级', '8级', '10级阵风'] as const
    const windDirections = ['北偏东', '东北', '东南', '西南', '西偏北'] as const
    const isTyphoon = mode === 'wind' && ((seed + index * 7) % 9 === 0)

    return [{
      id: `${mode}-${baseSeed.id}`,
      color: legendItem.color,
      accentColor: mixHexColor(
        legendItem.color,
        mode === 'precipitation' ? '#f4fbff' : '#ffffff',
        mode === 'precipitation' ? 0.34 : 0.4,
      ),
      hazeColor: mixHexColor(
        legendItem.color,
        mode === 'precipitation' ? '#061426' : '#091a31',
        mode === 'precipitation' ? 0.26 : 0.22,
      ),
      streakColor: mixHexColor(
        legendItem.color,
        mode === 'precipitation' ? '#f8fbff' : mode === 'cloud' ? '#eef6ff' : '#effbff',
        mode === 'precipitation' ? 0.48 : mode === 'cloud' ? 0.38 : 0.46,
      ),
      intensity: legendItem.label,
      legendGradient: `linear-gradient(135deg, ${legendItem.color}, ${legendItem.glowColor ?? mixHexColor(legendItem.color, '#ffffff', 0.32)})`,
      path: createClosedPath(
        mode === 'precipitation' ? 1 : mode === 'cloud' ? 1.08 : 1.03,
        1,
        mode === 'wind' ? 12 : 8,
        mode === 'wind' ? 14 : 6,
        mode === 'precipitation' ? 0.12 : mode === 'cloud' ? 0.08 : 0.14,
      ),
      innerPath: createClosedPath(
        mode === 'precipitation' ? 0.68 : mode === 'cloud' ? 0.74 : 0.66,
        2,
        mode === 'wind' ? 18 : 14,
        mode === 'wind' ? 16 : 10,
        mode === 'precipitation' ? 0.22 : mode === 'cloud' ? 0.16 : 0.2,
      ),
      haloPath: createClosedPath(
        mode === 'precipitation' ? 0.9 : mode === 'cloud' ? 0.98 : 0.92,
        3,
        mode === 'wind' ? 22 : 18,
        mode === 'wind' ? 20 : 14,
        mode === 'precipitation' ? 0.18 : mode === 'cloud' ? 0.12 : 0.18,
      ),
      glowPath: createClosedPath(
        mode === 'precipitation' ? 1.2 : mode === 'cloud' ? 1.32 : 1.24,
        4,
        mode === 'wind' ? 28 : 22,
        mode === 'wind' ? 22 : 20,
        mode === 'precipitation' ? 0.1 : mode === 'cloud' ? 0.14 : 0.18,
      ),
      texturePath: createTexturePath(),
      labelX: centroid.x,
      labelY: points.reduce((maxY, point) => Math.max(maxY, point.y), points[0]!.y) + 18,
      windDirection: mode === 'wind' ? windDirections[(seed + index) % windDirections.length] ?? windDirections[0] : null,
      windLevel: mode === 'wind' ? (isTyphoon ? '12级台风' : windLevels[(seed + index * 2) % windLevels.length] ?? windLevels[0]) : null,
      windFlowPath: mode === 'wind' ? createWindFlowPath() : null,
      isTyphoon,
    }]
  })
})
const note = computed(() => {
  if (!hasCoordinates.value) {
    return `${props.cityName}当前缺少可用地理坐标，地图页仍保留地图舱外观，待坐标恢复后会自动进入实时地图模式。`
  }

  if (lockedTargetPoint.value) {
    if (lockedTargetStatus.value === 'success' && lockedTargetPlaceName.value) {
      return `锁定已就位，当前目标位于 ${lockedTargetPlaceName.value}，继续点击地图可立即重置唯一准星。`
    }

    if (lockedTargetStatus.value === 'loading') {
      return '锁定已就位，正在解析目标地理名称，坐标锚点已经同步到地图视野中心。'
    }

    if (lockedTargetStatus.value === 'error') {
      return `当前位置名称解析失败，系统已回退显示坐标 ${lockedTargetPoint.value.lng.toFixed(4)}E · ${lockedTargetPoint.value.lat.toFixed(4)}N。`
    }

    return `锁定已就位，点击地图任意区域即可重新校准准星，当前锁定坐标为 ${lockedTargetPoint.value.lng.toFixed(4)}E · ${lockedTargetPoint.value.lat.toFixed(4)}N。`
  }

  return `${props.cityName}地图已接入在线底图与实时缩放控制，可拖动缩放条或使用两侧按键快速调整比例。`
})
const lockedTargetCoordinateLabel = computed(() => {
  if (!lockedTargetPoint.value) {
    return '点击地图任意位置，立即建立锁定。'
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

const handleOverlayHover = (mode: Exclude<WeatherOverlayMode, 'none'> | null) => {
  hoverPreviewMode.value = mode
}

const handleOverlaySelect = (mode: Exclude<WeatherOverlayMode, 'none'>) => {
  overlayMode.value = overlayMode.value === mode ? 'none' : mode
}

const handleZoomEnd = () => {
  syncZoomState()
  syncLockedTargetScreenPosition()
  invalidateOverlayProjection()
}

const handleBaseLayerTileError = (error: unknown) => {
  console.error('[WeatherMapExplorer] tile layer failed to load', error)
  mapError.value = '地图瓦片加载失败，请检查网络或稍后重试'
}

const handleMapMoveEnd = () => {
  syncLockedTargetScreenPosition()
  invalidateOverlayProjection()
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
  invalidateOverlayProjection()
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
  invalidateOverlayProjection()
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
    invalidateOverlayProjection()
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

      <svg
        v-if="globalWindFlowPath"
        class="weather-global-wind-field"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        data-testid="weather-global-wind-field"
      >
        <path class="weather-global-wind-field__glow" :d="globalWindFlowPath" />
        <path class="weather-global-wind-field__stream" :d="globalWindFlowPath" />
        <path class="weather-global-wind-field__highlight" :d="globalWindFlowPath" />
      </svg>

      <div class="map-overlay">
        <div class="weather-layer-console">
          <button
            v-for="item in weatherOverlayOptions"
            :key="item.key"
            type="button"
            class="weather-layer-btn"
            :class="{
              'is-active': overlayMode === item.key,
              'is-previewing': overlayMode === 'none' && hoverPreviewMode === item.key,
            }"
            :aria-label="item.label"
            @mouseenter="handleOverlayHover(item.key)"
            @mouseleave="handleOverlayHover(null)"
            @focus="handleOverlayHover(item.key)"
            @blur="handleOverlayHover(null)"
            @click="handleOverlaySelect(item.key)"
          >
            <img class="weather-layer-btn__icon" :src="item.iconSrc" :alt="item.label" />
          </button>
        </div>

        <div class="location-card">
          <span class="location-card__label">LOCKED TARGET</span>
          <strong class="location-card__value">{{ lockedTargetPoint ? 'TARGET LOCKED' : props.cityName }}</strong>
          <span class="location-card__meta">{{ lockedTargetPoint ? lockedTargetDisplayName : locationLabel }}</span>
          <span class="location-card__meta location-card__meta--secondary">
            {{ lockedTargetPoint ? lockedTargetCoordinateLabel : coordinateLabel }}
          </span>
        </div>

        <div class="map-console-stack" data-testid="map-console-stack">
          <div
            v-if="activeLegend.length"
            class="weather-legend"
            data-testid="weather-overlay-legend"
          >
            <span class="weather-legend__label">{{ previewTitle }}</span>
            <div class="weather-legend__bar" :style="{ backgroundImage: activeLegendGradient }">
              <span
                v-for="item in activeLegend"
                :key="item.label"
                class="weather-legend__segment"
                :style="{ '--legend-segment-glow': item.glowColor ?? item.color }"
              />
            </div>
            <div class="weather-legend__ticks">
              <span
                v-for="item in activeLegend"
                :key="item.label"
                class="weather-legend__tick"
              >
                {{ item.label }}
              </span>
            </div>
            <div
              v-if="visibleOverlayMode === 'wind'"
              class="weather-legend__wind-direction"
              data-testid="weather-wind-direction"
            >
              <span class="weather-legend__wind-direction-label">GLOBAL FLOW</span>
              <strong>{{ activeWindDirection }}</strong>
            </div>
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
      </div>

      <svg
        v-if="overlayRegions.length"
        class="weather-overlay-field"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        :data-overlay-mode="visibleOverlayMode"
        :data-testid="`weather-overlay-${visibleOverlayMode}`"
      >
        <g
          v-for="region in overlayRegions"
          :key="region.id"
          class="weather-overlay-region"
        >
          <path
            class="weather-overlay-region__glow"
            :d="region.glowPath"
            :fill="region.hazeColor"
          />
          <path
            class="weather-overlay-region__halo"
            :d="region.haloPath"
            :fill="region.color"
          />
          <path
            class="weather-overlay-region__core"
            :d="region.path"
            :fill="region.color"
          />
          <path
            class="weather-overlay-region__texture"
            :d="region.texturePath"
            :stroke="region.streakColor"
          />
          <path
            v-if="region.windFlowPath"
            class="weather-overlay-region__wind-flow"
            :d="region.windFlowPath"
            :stroke="region.streakColor"
          />
          <path
            class="weather-overlay-region__accent"
            :d="region.innerPath"
            :fill="region.accentColor"
          />
          <g
            v-if="region.windLevel"
            class="weather-overlay-region__marker"
            :class="{ 'is-typhoon': region.isTyphoon }"
          >
            <rect
              class="weather-overlay-region__label-box"
              :x="(region.labelX - (region.isTyphoon ? 64 : 42)).toFixed(2)"
              :y="(region.labelY - 13).toFixed(2)"
              :width="(region.isTyphoon ? 128 : 84).toFixed(2)"
              height="26"
              rx="13"
            />
            <text
              class="weather-overlay-region__label"
              :x="region.labelX.toFixed(2)"
              :y="region.labelY.toFixed(2)"
            >
              {{ region.windLevel }}
            </text>
            <text
              v-if="region.windDirection"
              class="weather-overlay-region__sub-label"
              :x="region.labelX.toFixed(2)"
              :y="(region.labelY + 16).toFixed(2)"
            >
              {{ region.windDirection }}
            </text>
            <text
              v-if="region.isTyphoon"
              class="weather-overlay-region__typhoon-label"
              :x="region.labelX.toFixed(2)"
              :y="(region.labelY - 18).toFixed(2)"
            >
              TYPHOON CORE
            </text>
          </g>
        </g>
      </svg>

      <div v-if="!hasCoordinates || mapError" class="map-fallback">
        <p class="map-fallback__title">{{ mapError || '城市坐标暂不可用' }}</p>
        <p class="map-fallback__text">当前地图页仍可保留完整赛博面板，待坐标恢复后会自动载入真实底图与比例尺。</p>
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

.weather-global-wind-field {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}

.weather-global-wind-field__glow {
  fill: none;
  stroke: rgba(120, 228, 255, 0.28);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 24;
  filter: blur(18px);
  mix-blend-mode: screen;
  animation: weather-wind-field-shift 9.2s linear infinite;
}

.weather-global-wind-field__stream {
  fill: none;
  stroke: rgba(214, 247, 255, 0.4);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 6;
  stroke-dasharray: 30 18;
  filter:
    drop-shadow(0 0 12px rgba(117, 241, 255, 0.26))
    drop-shadow(0 0 24px rgba(117, 241, 255, 0.18));
  mix-blend-mode: screen;
  animation:
    weather-wind-field-shift 7.2s linear infinite,
    weather-wind-field-dash 2.8s linear infinite;
}

.weather-global-wind-field__highlight {
  fill: none;
  stroke: rgba(245, 253, 255, 0.62);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
  stroke-dasharray: 10 20;
  filter:
    drop-shadow(0 0 10px rgba(210, 245, 255, 0.34))
    drop-shadow(0 0 22px rgba(117, 241, 255, 0.22));
  mix-blend-mode: screen;
  animation:
    weather-wind-field-shift 6.4s linear infinite reverse,
    weather-wind-field-dash 1.9s linear infinite;
}

.weather-layer-console {
  display: inline-flex;
  gap: 10px;
  align-self: flex-start;
  pointer-events: auto;
}

.weather-layer-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(117, 241, 255, 0.22);
  background:
    linear-gradient(135deg, rgba(6, 24, 54, 0.88), rgba(3, 12, 28, 0.96)),
    rgba(4, 12, 28, 0.92);
  color: rgba(231, 249, 255, 0.92);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.08),
    0 0 20px rgba(117, 241, 255, 0.08);
  transition:
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    transform var(--cyber-ease),
    background var(--cyber-ease);
}

.weather-layer-btn:hover,
.weather-layer-btn.is-previewing,
.weather-layer-btn.is-active {
  border-color: rgba(148, 245, 255, 0.62);
  transform: translateY(-1px);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.16),
    0 0 18px rgba(117, 241, 255, 0.18);
}

.weather-layer-btn.is-active {
  background:
    linear-gradient(135deg, rgba(88, 225, 255, 0.24), rgba(125, 84, 255, 0.18)),
    rgba(6, 26, 58, 0.94);
}

.weather-layer-btn__icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter:
    brightness(0)
    saturate(100%)
    invert(88%)
    sepia(29%)
    saturate(1427%)
    hue-rotate(152deg)
    brightness(121%)
    contrast(116%)
    drop-shadow(0 0 10px rgba(117, 241, 255, 0.34))
    drop-shadow(0 0 18px rgba(140, 112, 255, 0.18));
  opacity: 0.96;
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

.map-console-stack {
  pointer-events: none;
  align-self: flex-end;
  display: grid;
  gap: 12px;
  justify-items: stretch;
  width: min(360px, calc(100% - 12px));
}

.zoom-console {
  pointer-events: auto;
  width: 100%;
  padding: 14px 16px;
}

.weather-legend {
  pointer-events: none;
  width: 100%;
  padding: 12px 14px;
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(7, 17, 39, 0.94) 0%, rgba(3, 10, 26, 0.9) 100%);
  box-shadow:
    inset 0 1px 0 rgba(183, 245, 255, 0.08),
    inset 0 0 22px rgba(117, 241, 255, 0.08),
    0 18px 36px rgba(0, 0, 0, 0.34),
    0 0 24px rgba(55, 187, 255, 0.12);
  backdrop-filter: blur(14px);
}

.weather-legend::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(96, 216, 255, 0.09), transparent 40%),
    radial-gradient(circle at top right, rgba(92, 154, 255, 0.16), transparent 58%);
  opacity: 0.9;
  pointer-events: none;
}

.weather-legend::after {
  content: '';
  position: absolute;
  inset: auto 14px 10px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(117, 241, 255, 0.32), transparent);
  pointer-events: none;
}

.weather-legend__label {
  position: relative;
  z-index: 1;
  display: block;
  color: rgba(201, 246, 255, 0.88);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-shadow: 0 0 10px rgba(70, 197, 255, 0.32);
}

.weather-legend__bar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  margin-top: 10px;
  min-height: 16px;
  padding: 2px;
  border-radius: 999px;
  border: 1px solid rgba(133, 234, 255, 0.18);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.08),
    0 0 16px rgba(65, 178, 255, 0.14);
}

.weather-legend__segment {
  flex: 1 1 0;
  display: block;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 12px var(--legend-segment-glow, rgba(117, 241, 255, 0.2));
}

.weather-legend__ticks {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  margin-top: 8px;
}

.weather-legend__tick {
  color: rgba(232, 247, 255, 0.84);
  font-size: 10px;
  text-align: center;
  text-shadow: 0 0 8px rgba(14, 59, 94, 0.56);
}

.weather-legend__wind-direction {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 4px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(117, 241, 255, 0.12);
  color: rgba(224, 247, 255, 0.88);
}

.weather-legend__wind-direction-label {
  color: rgba(117, 241, 255, 0.58);
  font-size: 10px;
  letter-spacing: 0.18em;
}

.weather-overlay-field {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.weather-overlay-region__glow {
  opacity: 0.2;
  filter: blur(24px) saturate(120%);
  animation: weather-overlay-drift 7.4s ease-in-out infinite;
}

.weather-overlay-region__halo {
  opacity: 0.18;
  filter: blur(8px) saturate(118%);
  mix-blend-mode: screen;
  animation: weather-overlay-drift 6.9s ease-in-out infinite reverse;
}

.weather-overlay-region__core {
  opacity: 0.34;
  stroke: rgba(232, 249, 255, 0.22);
  stroke-width: 1.5;
  filter:
    drop-shadow(0 0 10px rgba(117, 241, 255, 0.14))
    drop-shadow(0 0 22px rgba(117, 241, 255, 0.16));
  animation: weather-overlay-drift 6.4s ease-in-out infinite;
}

.weather-overlay-region__texture {
  fill: none;
  opacity: 0.32;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 8;
  filter:
    blur(1px)
    drop-shadow(0 0 10px rgba(234, 247, 255, 0.16));
  mix-blend-mode: screen;
  animation: weather-overlay-drift 5.6s ease-in-out infinite reverse;
}

.weather-overlay-region__wind-flow {
  fill: none;
  opacity: 0.42;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 5;
  filter:
    blur(0.3px)
    drop-shadow(0 0 8px rgba(211, 245, 255, 0.22));
  mix-blend-mode: screen;
  animation: weather-overlay-drift 4.8s ease-in-out infinite;
}

.weather-overlay-region__accent {
  opacity: 0.22;
  filter:
    blur(3px)
    drop-shadow(0 0 12px rgba(236, 249, 255, 0.2));
  mix-blend-mode: screen;
  animation: weather-overlay-drift 5.8s ease-in-out infinite;
}

.weather-overlay-region__label-box {
  fill: rgba(4, 17, 39, 0.76);
  stroke: rgba(117, 241, 255, 0.24);
  stroke-width: 1;
  filter:
    drop-shadow(0 0 10px rgba(32, 126, 183, 0.2))
    drop-shadow(0 0 18px rgba(117, 241, 255, 0.12));
}

.weather-overlay-region__label {
  fill: rgba(239, 250, 255, 0.96);
  font-size: 12px;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: middle;
  letter-spacing: 0.08em;
}

.weather-overlay-region__sub-label {
  fill: rgba(179, 233, 255, 0.86);
  font-size: 10px;
  text-anchor: middle;
  dominant-baseline: middle;
}

.weather-overlay-region__typhoon-label {
  fill: rgba(255, 170, 187, 0.96);
  font-size: 10px;
  font-weight: 700;
  text-anchor: middle;
  letter-spacing: 0.18em;
  text-shadow: 0 0 12px rgba(255, 107, 143, 0.4);
}

.weather-overlay-region__marker.is-typhoon .weather-overlay-region__label-box {
  fill: rgba(36, 7, 24, 0.84);
  stroke: rgba(255, 110, 138, 0.4);
  filter:
    drop-shadow(0 0 12px rgba(255, 110, 138, 0.24))
    drop-shadow(0 0 26px rgba(255, 110, 138, 0.18));
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

@keyframes weather-overlay-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(0, -4px, 0) scale(1.02);
  }
}

@keyframes weather-wind-field-shift {
  0% {
    transform: translate3d(-2%, 0, 0);
  }

  50% {
    transform: translate3d(1.5%, -0.8%, 0);
  }

  100% {
    transform: translate3d(4%, 0.6%, 0);
  }
}

@keyframes weather-wind-field-dash {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: -96;
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

  .weather-legend {
    width: 100%;
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
