import { beforeEach, describe, expect, it, vi } from 'vitest'
import router, { resolveProtectedRoute, resolveWeatherEntryRoute } from '@/router'

describe('router auth guard', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('redirects unauthenticated users away from protected routes', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => (key === 'auth_token' ? null : null)),
    })

    const result = resolveProtectedRoute('/login-list', true)

    expect(result).toEqual({
      path: '/login',
      query: {
        reason: 'unauthorized',
        redirect: '/login-list',
      },
    })
  })

  it('redirects /weather to the stored default city detail route', () => {
    localStorage.setItem('city_list', JSON.stringify([
      { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
      { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
    ]))

    const result = resolveWeatherEntryRoute()

    expect(result).toEqual({
      name: 'city-detail',
      params: {
        cityName: '武汉市',
      },
    })
  })

  it('keeps /weather on the home route when no stored default city exists', () => {
    const result = resolveWeatherEntryRoute()

    expect(result).toBe(true)
  })

  it('keeps city detail overview route available at /weather/:cityName', () => {
    const result = router.resolve({
      name: 'city-detail',
      params: { cityName: '武汉市' },
    })

    expect(result.fullPath).toBe('/weather/%E6%AD%A6%E6%B1%89%E5%B8%82')
  })

  it('resolves the temperature trend child route for the current city', () => {
    const result = router.resolve({
      name: 'city-temperature-trend',
      params: { cityName: '武汉市' },
    })

    expect(result.fullPath).toBe('/weather/%E6%AD%A6%E6%B1%89%E5%B8%82/temperature-trend')
  })
})
