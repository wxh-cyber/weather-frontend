import { describe, expect, it } from 'vitest'
import { resolveWeatherOverlayKind, resolveWeatherOverlayPhase } from '@/utils/weatherOverlays'

describe('weather overlay utils', () => {
  it('resolves overlay kind from weather text', () => {
    expect(resolveWeatherOverlayKind('晴')).toBe('sunny')
    expect(resolveWeatherOverlayKind('多云')).toBe('cloudy')
    expect(resolveWeatherOverlayKind('阴天')).toBe('overcast')
    expect(resolveWeatherOverlayKind('小雨')).toBe('rainy')
    expect(resolveWeatherOverlayKind('小雪')).toBe('snowy')
    expect(resolveWeatherOverlayKind('阵雨')).toBe('showers')
    expect(resolveWeatherOverlayKind('雷阵雨')).toBe('thunder-showers')
    expect(resolveWeatherOverlayKind('雾')).toBe('none')
  })

  it('alternates showers between rainy and sunny every five seconds', () => {
    expect(resolveWeatherOverlayPhase('阵雨', new Date(0))).toMatchObject({
      kind: 'showers',
      layer: 'rainy',
      isAlternating: true,
      isLightningActive: false,
    })

    expect(resolveWeatherOverlayPhase('阵雨', new Date(5_000))).toMatchObject({
      kind: 'showers',
      layer: 'sunny',
      isAlternating: true,
      isLightningActive: false,
    })
  })

  it('enables lightning only during thunder-shower rain phase windows', () => {
    expect(resolveWeatherOverlayPhase('雷阵雨', new Date(300))).toMatchObject({
      kind: 'thunder-showers',
      layer: 'rainy',
      isAlternating: true,
      isLightningActive: true,
    })

    expect(resolveWeatherOverlayPhase('雷阵雨', new Date(1_500))).toMatchObject({
      kind: 'thunder-showers',
      layer: 'rainy',
      isAlternating: true,
      isLightningActive: false,
    })

    expect(resolveWeatherOverlayPhase('雷阵雨', new Date(5_300))).toMatchObject({
      kind: 'thunder-showers',
      layer: 'sunny',
      isAlternating: true,
      isLightningActive: false,
    })
  })
})
