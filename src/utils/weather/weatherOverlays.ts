export type WeatherOverlayKind =
  | 'sunny'
  | 'cloudy'
  | 'overcast'
  | 'rainy'
  | 'snowy'
  | 'showers'
  | 'thunder-showers'
  | 'none'

export type WeatherOverlayBaseLayer = 'sunny' | 'cloudy' | 'overcast' | 'rainy' | 'snowy' | 'none'

export interface WeatherOverlayPhase {
  kind: WeatherOverlayKind
  layer: WeatherOverlayBaseLayer
  isAlternating: boolean
  isLightningActive: boolean
}

const PHASE_DURATION_MS = 5_000
const CYCLE_DURATION_MS = PHASE_DURATION_MS * 2

export const resolveWeatherOverlayKind = (weatherText: string): WeatherOverlayKind => {
  const normalized = weatherText.trim()

  if (!normalized) return 'none'
  if (normalized.includes('雷阵雨')) return 'thunder-showers'
  if (normalized.includes('阵雨')) return 'showers'
  if (normalized.includes('雪')) return 'snowy'
  if (normalized.includes('雨')) return 'rainy'
  if (normalized.includes('多云')) return 'cloudy'
  if (normalized.includes('阴')) return 'overcast'
  if (normalized.includes('晴')) return 'sunny'
  return 'none'
}

const isLightningWindow = (phaseTime: number) =>
  (phaseTime >= 250 && phaseTime < 650) || (phaseTime >= 2_450 && phaseTime < 2_850)

export const resolveWeatherOverlayPhase = (weatherText: string, date = new Date()): WeatherOverlayPhase => {
  const kind = resolveWeatherOverlayKind(weatherText)

  if (kind === 'showers' || kind === 'thunder-showers') {
    const cycleTime = ((date.getTime() % CYCLE_DURATION_MS) + CYCLE_DURATION_MS) % CYCLE_DURATION_MS
    const isRainPhase = cycleTime < PHASE_DURATION_MS
    const phaseTime = cycleTime % PHASE_DURATION_MS

    return {
      kind,
      layer: isRainPhase ? 'rainy' : 'sunny',
      isAlternating: true,
      isLightningActive: kind === 'thunder-showers' && isRainPhase && isLightningWindow(phaseTime),
    }
  }

  return {
    kind,
    layer: kind === 'none' ? 'none' : kind,
    isAlternating: false,
    isLightningActive: false,
  }
}
