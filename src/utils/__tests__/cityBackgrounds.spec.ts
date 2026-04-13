import { describe, expect, it } from 'vitest'
import {
  buildCityBackgroundMap,
  getCityBackgroundEntry,
  parseCityBackgroundAssetPath,
  resolveCityBackground,
} from '@/utils/cityBackgrounds'

describe('city background utilities', () => {
  it('should parse full-width parenthesis asset paths', () => {
    expect(parseCityBackgroundAssetPath('../assets/cities/南昌市（昼）.jpg')).toEqual({
      cityName: '南昌市',
      variant: 'day',
    })
    expect(parseCityBackgroundAssetPath('../assets/cities/武汉市（昏）.png')).toEqual({
      cityName: '武汉市',
      variant: 'dusk',
    })
  })

  it('should build background map entries from parsed asset paths', () => {
    const map = buildCityBackgroundMap({
      '../assets/cities/南昌市（昼）.jpg': '/assets/nanchang-day.jpg',
      '../assets/cities/武汉市（昏）.png': '/assets/wuhan-dusk.png',
    })

    expect(map['南昌市']).toEqual({
      day: '/assets/nanchang-day.jpg',
    })
    expect(map['武汉市']).toEqual({
      dusk: '/assets/wuhan-dusk.png',
    })
  })

  it('should resolve actual backgrounds for 南昌市 and 武汉市 from bundled assets', () => {
    expect(getCityBackgroundEntry('南昌市')).not.toBeNull()
    expect(getCityBackgroundEntry('武汉市')).not.toBeNull()
    expect(resolveCityBackground('南昌市', new Date('2026-04-13T08:00:00+08:00'))).not.toBe('')
    expect(resolveCityBackground('武汉市', new Date('2026-04-13T18:30:00+08:00'))).not.toBe('')
  })

  it('should return empty string for city without background assets', () => {
    expect(getCityBackgroundEntry('不存在城市')).toBeNull()
    expect(resolveCityBackground('不存在城市', new Date('2026-04-13T12:00:00+08:00'))).toBe('')
  })
})
