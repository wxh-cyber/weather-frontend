import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCityStore } from '@/store/city'
import { getCityList, type CityListResponse } from '@/service/city'

vi.mock('@/service/city', () => ({
  getCityList: vi.fn(),
}))

const mockedGetCityList = vi.mocked(getCityList)

describe('city store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockedGetCityList.mockReset()
  })

  it('fetchCities should update city list and persist when success', async () => {
    const mockedResponse: CityListResponse = {
      code: 0,
      message: '获取成功',
      data: [{ cityName: '武汉市', weatherText: '晴', temperature: '26°C' }],
    }
    mockedGetCityList.mockResolvedValue(mockedResponse)

    const store = useCityStore()
    await store.fetchCities('武汉')

    expect(mockedGetCityList).toHaveBeenCalledWith('武汉')
    expect(store.error).toBe('')
    expect(store.loading).toBe(false)
    expect(store.cities).toEqual(mockedResponse.data)
    expect(localStorage.getItem('city_list')).toBe(JSON.stringify(mockedResponse.data))
  })

  it('fetchCities should set error without throwing when request fails', async () => {
    mockedGetCityList.mockRejectedValue(new Error('网络异常'))
    const store = useCityStore()
    store.setCities([{ cityName: '上海市', weatherText: '阴', temperature: '22°C' }])

    await expect(store.fetchCities('错误关键字')).resolves.toBeUndefined()
    expect(store.loading).toBe(false)
    expect(store.error).toBe('网络异常')
    expect(store.cities).toEqual([{ cityName: '上海市', weatherText: '阴', temperature: '22°C' }])
  })
})
