import { describe, expect, it } from 'vitest'
import {
  isEquivalentCityName,
  normalizeCityInput,
  resolveCanonicalCityName,
  resolveDisplayCityName,
} from './cityNameDisplay'

describe('cityNameDisplay', () => {
  it('normalizes basic input whitespace', () => {
    expect(normalizeCityInput(' 北京 ')).toBe('北京')
  })

  it('resolves configured aliases to canonical full names', () => {
    expect(resolveCanonicalCityName('广州')).toBe('广州市')
    expect(resolveCanonicalCityName('广州市')).toBe('广州市')
    expect(resolveCanonicalCityName(' 北京 ')).toBe('北京市')
  })

  it('resolves broader administrative division names to canonical full names', () => {
    expect(resolveCanonicalCityName('香港')).toBe('香港特别行政区')
    expect(resolveCanonicalCityName('澳门')).toBe('澳门特别行政区')
    expect(resolveCanonicalCityName('洪山')).toBe('洪山区')
    expect(resolveCanonicalCityName('沙市')).toBe('沙市区')
    expect(resolveCanonicalCityName('虎门')).toBe('东莞市')
    expect(resolveCanonicalCityName('虎门镇')).toBe('东莞市')
  })

  it('keeps unconfigured place names unchanged', () => {
    expect(resolveCanonicalCityName('杭州市')).toBe('杭州市')
    expect(resolveDisplayCityName('杭州高新区')).toBe('杭州高新区')
  })

  it('treats equivalent short and full place names as the same place', () => {
    expect(isEquivalentCityName('广州', '广州市')).toBe(true)
    expect(isEquivalentCityName('北京', '北京市')).toBe(true)
    expect(isEquivalentCityName('香港', '香港特别行政区')).toBe(true)
    expect(isEquivalentCityName('洪山', '洪山区')).toBe(true)
    expect(isEquivalentCityName('洪山区', '武汉市')).toBe(false)
    expect(isEquivalentCityName('广州', '深圳市')).toBe(false)
  })
})
