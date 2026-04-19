import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/store/auth'
import { useCityStore } from '@/store/city'
import { buildCityListStorageKey, clearPersistedCitiesForUserId } from '@/store/city'
import { createCity, deleteCity, getCityList, type CityListResponse, updateCity } from '@/service/city'

vi.mock('@/service/city', () => ({
  getCityList: vi.fn(),
  createCity: vi.fn(),
  updateCity: vi.fn(),
  deleteCity: vi.fn(),
}))

const mockedGetCityList = vi.mocked(getCityList)
const mockedCreateCity = vi.mocked(createCity)
const mockedUpdateCity = vi.mocked(updateCity)
const mockedDeleteCity = vi.mocked(deleteCity)

const sampleResponse: CityListResponse = {
  code: 0,
  message: '获取成功',
  data: [
    { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
    { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
  ],
}

const loginAs = (userId = 'u-1') => {
  const authStore = useAuthStore()
  authStore.setAuth(`token-${userId}`, {
    userId,
    email: `${userId}@weather.com`,
  })
}

describe('city store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockedGetCityList.mockReset()
    mockedCreateCity.mockReset()
    mockedUpdateCity.mockReset()
    mockedDeleteCity.mockReset()
  })

  it('fetchCities should update city list and persist when success', async () => {
    loginAs()
    mockedGetCityList.mockResolvedValue(sampleResponse)

    const store = useCityStore()
    await store.fetchCities('武汉')

    expect(mockedGetCityList).toHaveBeenCalledWith('武汉')
    expect(store.error).toBe('')
    expect(store.loading).toBe(false)
    expect(store.cities).toEqual(sampleResponse.data)
    expect(localStorage.getItem(buildCityListStorageKey('u-1'))).toBe(JSON.stringify(sampleResponse.data))
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

  it('ensureCitiesLoaded should skip request when pinia has cities', async () => {
    const store = useCityStore()
    store.setCities([{ cityName: '深圳市', weatherText: '小雨', temperature: '24°C' }])

    await store.ensureCitiesLoaded()

    expect(mockedGetCityList).not.toHaveBeenCalled()
  })

  it('ensureCitiesLoaded should request backend when pinia is empty', async () => {
    loginAs()
    mockedGetCityList.mockResolvedValue(sampleResponse)
    const store = useCityStore()

    await store.ensureCitiesLoaded()

    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(store.cities).toEqual(sampleResponse.data)
  })

  it('ensureCitiesLoaded should refresh stale cities restored from localStorage', async () => {
    loginAs()
    localStorage.setItem(buildCityListStorageKey('u-1'), JSON.stringify([
      {
        cityName: '上海市',
        country: '美国',
        province: '伊利诺伊州',
        latitude: 41.05087,
        longitude: -90.4968,
        weatherText: '晴',
        temperature: '26°C',
      },
      {
        cityName: '广州市',
        country: '中国',
        province: '',
        latitude: null,
        longitude: null,
        weatherText: '多云',
        temperature: '29°C',
      },
    ]))
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [
        {
          cityName: '上海市',
          country: '中国',
          province: '上海市',
          cityCode: '310000',
          latitude: 31.2304,
          longitude: 121.4737,
          weatherText: '晴',
          temperature: '26°C',
        },
        {
          cityName: '广州市',
          country: '中国',
          province: '广东省',
          cityCode: '440100',
          latitude: 23.1291,
          longitude: 113.2644,
          weatherText: '多云',
          temperature: '29°C',
        },
      ],
    })

    const store = useCityStore()
    store.syncFromStorage()

    expect(store.cities[0]?.country).toBe('美国')

    await store.ensureCitiesLoaded()

    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(store.cities[0]).toMatchObject({
      cityName: '上海市',
      country: '中国',
      province: '上海市',
      latitude: 31.2304,
      longitude: 121.4737,
    })
    expect(store.cities[1]).toMatchObject({
      cityName: '广州市',
      province: '广东省',
      latitude: 23.1291,
      longitude: 113.2644,
    })
    expect(localStorage.getItem(buildCityListStorageKey('u-1'))).toContain('"country":"中国"')
  })

  it('ensureCitiesLoaded should not repeat request after backend refresh succeeds', async () => {
    loginAs()
    mockedGetCityList.mockResolvedValue(sampleResponse)
    const store = useCityStore()
    store.syncFromStorage()

    await store.ensureCitiesLoaded()
    await store.ensureCitiesLoaded()

    expect(mockedGetCityList).toHaveBeenCalledTimes(1)
  })

  it('syncFromStorage should keep cities empty when localStorage has no city_list', () => {
    loginAs()
    const store = useCityStore()

    store.syncFromStorage()

    expect(store.cities).toEqual([])
    expect(localStorage.getItem(buildCityListStorageKey('u-1'))).toBeNull()
  })

  it('syncFromStorage should migrate legacy default city list to empty array', () => {
    loginAs()
    localStorage.setItem(
      'city_list',
      JSON.stringify([
        { cityName: '沙市区', weatherText: '多云', temperature: '11°C' },
        { cityName: '双港东大街', weatherText: '小雨', temperature: '10°C' },
        { cityName: '南昌市', weatherText: '阴天', temperature: '12°C' },
        { cityName: '荆州市', weatherText: '晴', temperature: '13°C' },
        { cityName: '武汉市', weatherText: '阵雨', temperature: '14°C' },
      ]),
    )
    const store = useCityStore()

    store.syncFromStorage()

    expect(store.cities).toEqual([])
    expect(localStorage.getItem('city_list')).toBeNull()
    expect(localStorage.getItem(buildCityListStorageKey('u-1'))).toBeNull()
  })

  it('syncFromStorage should keep cities empty when city_list is invalid json', () => {
    loginAs()
    localStorage.setItem(buildCityListStorageKey('u-1'), '{invalid json')
    const store = useCityStore()

    store.syncFromStorage()

    expect(store.cities).toEqual([])
    expect(localStorage.getItem(buildCityListStorageKey('u-1'))).toBe('[]')
  })

  it('syncFromStorage should clear malformed city entries before backend refresh', async () => {
    loginAs()
    localStorage.setItem(buildCityListStorageKey('u-1'), JSON.stringify([{ province: '上海市' }]))
    mockedGetCityList.mockResolvedValue(sampleResponse)
    const store = useCityStore()

    store.syncFromStorage()
    await store.ensureCitiesLoaded()

    expect(store.cities).toEqual(sampleResponse.data)
    expect(localStorage.getItem(buildCityListStorageKey('u-1'))).toBe(JSON.stringify(sampleResponse.data))
  })

  it('createCityByName should fail when duplicated name exists in pinia', async () => {
    loginAs()
    const store = useCityStore()
    store.setCities([{ cityName: '武汉市', weatherText: '晴', temperature: '20°C' }])

    const result = await store.createCityByName('武汉市')

    expect(result).toBe(false)
    expect(mockedCreateCity).not.toHaveBeenCalled()
    expect(store.error).toContain('已存在')
  })

  it('createCityByName should call backend and update list when success', async () => {
    loginAs()
    mockedCreateCity.mockResolvedValue(sampleResponse)
    const store = useCityStore()

    const result = await store.createCityByName('武汉市')

    expect(result).toBe(true)
    expect(mockedCreateCity).toHaveBeenCalledWith('武汉市')
    expect(store.cities).toEqual(sampleResponse.data)
  })

  it('createCityByName should keep the new city as default when list was empty', async () => {
    loginAs()
    mockedCreateCity.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [{ cityName: '武汉市', weatherText: '晴', temperature: '26°C' }],
    })
    const store = useCityStore()

    const result = await store.createCityByName('武汉市')

    expect(result).toBe(true)
    expect(store.cities[0]?.cityName).toBe('武汉市')
    expect(localStorage.getItem(buildCityListStorageKey('u-1'))).toBe(
      JSON.stringify([{ cityName: '武汉市', weatherText: '晴', temperature: '26°C' }]),
    )
  })

  it('createCityByName should preserve the existing default city when list is not empty', async () => {
    loginAs()
    mockedCreateCity.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [
        { cityName: '北京市', weatherText: '小雨', temperature: '19°C' },
        { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
        { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
      ],
    })
    const store = useCityStore()
    store.setCities([
      { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
      { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
    ])

    const result = await store.createCityByName('北京市')

    expect(result).toBe(true)
    expect(store.cities.map((item) => item.cityName)).toEqual(['上海市', '武汉市', '北京市'])
    expect(store.cities[0]?.cityName).toBe('上海市')
    expect(localStorage.getItem(buildCityListStorageKey('u-1'))).toBe(
      JSON.stringify([
        { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
        { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
        { cityName: '北京市', weatherText: '小雨', temperature: '19°C' },
      ]),
    )
  })

  it('renameCity should fallback fetch when source not found in pinia', async () => {
    loginAs()
    mockedGetCityList.mockResolvedValue(sampleResponse)
    mockedUpdateCity.mockResolvedValue({
      ...sampleResponse,
      data: [
        { cityName: '武昌区', weatherText: '晴', temperature: '26°C' },
        { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
      ],
    })
    const store = useCityStore()

    const result = await store.renameCity('武汉市', '武昌区')

    expect(result).toBe(true)
    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(mockedUpdateCity).toHaveBeenCalledWith('武汉市', '武昌区')
  })

  it('renameCity should fail when target duplicated', async () => {
    loginAs()
    const store = useCityStore()
    store.setCities(sampleResponse.data)

    const result = await store.renameCity('武汉市', '上海市')

    expect(result).toBe(false)
    expect(mockedUpdateCity).not.toHaveBeenCalled()
    expect(store.error).toContain('已存在')
  })

  it('deleteCityByName should fail when city not found after fallback', async () => {
    loginAs()
    mockedDeleteCity.mockRejectedValue(new Error('未找到待删除的城市'))
    const store = useCityStore()

    const result = await store.deleteCityByName('不存在城市')

    expect(result).toBe(false)
    expect(mockedDeleteCity).toHaveBeenCalledWith('不存在城市')
    expect(store.error).toContain('未找到')
  })

  it('deleteCityByName should call backend and update list when success', async () => {
    loginAs()
    mockedDeleteCity.mockResolvedValue({
      ...sampleResponse,
      data: [{ cityName: '上海市', weatherText: '多云', temperature: '22°C' }],
    })
    const store = useCityStore()
    store.setCities(sampleResponse.data)

    const result = await store.deleteCityByName('武汉市')

    expect(result).toBe(true)
    expect(mockedDeleteCity).toHaveBeenCalledWith('武汉市')
    expect(store.cities).toEqual([{ cityName: '上海市', weatherText: '多云', temperature: '22°C' }])
  })

  it('deleteCityByName should not depend on current pinia list during sequential deletes', async () => {
    loginAs()
    mockedDeleteCity
      .mockResolvedValueOnce({
        ...sampleResponse,
        data: [{ cityName: '上海市', weatherText: '多云', temperature: '22°C' }],
      })
      .mockResolvedValueOnce({
        ...sampleResponse,
        data: [],
      })
    const store = useCityStore()
    store.setCities(sampleResponse.data)

    const firstResult = await store.deleteCityByName('武汉市')
    store.setCities([])
    const secondResult = await store.deleteCityByName('上海市')

    expect(firstResult).toBe(true)
    expect(secondResult).toBe(true)
    expect(mockedDeleteCity).toHaveBeenNthCalledWith(1, '武汉市')
    expect(mockedDeleteCity).toHaveBeenNthCalledWith(2, '上海市')
    expect(mockedGetCityList).not.toHaveBeenCalled()
    expect(store.cities).toEqual([])
  })

  it('setDefaultCityByName should move target city to first position when city exists', async () => {
    loginAs()
    const store = useCityStore()
    store.setCities(sampleResponse.data)

    const result = await store.setDefaultCityByName('上海市')

    expect(result).toBe(true)
    expect(store.cities[0]?.cityName).toBe('上海市')
    expect(store.cities[1]?.cityName).toBe('武汉市')
  })

  it('setDefaultCityByName should fallback fetch when city is missing in pinia', async () => {
    loginAs()
    mockedGetCityList.mockResolvedValue(sampleResponse)
    const store = useCityStore()

    const result = await store.setDefaultCityByName('上海市')

    expect(result).toBe(true)
    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(store.cities[0]?.cityName).toBe('上海市')
  })

  it('setDefaultCityByName should fail with message when city is still missing after fallback', async () => {
    loginAs()
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [{ cityName: '北京市', weatherText: '晴', temperature: '20°C' }],
    })
    const store = useCityStore()

    const result = await store.setDefaultCityByName('不存在城市')

    expect(result).toBe(false)
    expect(store.error).toContain('未找到该城市')
  })

  it('syncFromStorage should keep cities empty when current user has no cached list but another user does', () => {
    loginAs('u-2')
    localStorage.setItem(buildCityListStorageKey('u-1'), JSON.stringify(sampleResponse.data))
    const store = useCityStore()

    store.syncFromStorage()

    expect(store.cities).toEqual([])
    expect(store.hydratedFromStorage).toBe(false)
  })

  it('clearPersistedCitiesForUserId should only remove the target user cache', () => {
    localStorage.setItem(buildCityListStorageKey('u-1'), JSON.stringify(sampleResponse.data))
    localStorage.setItem(buildCityListStorageKey('u-2'), JSON.stringify([{ cityName: '深圳市', weatherText: '雨', temperature: '24°C' }]))

    clearPersistedCitiesForUserId('u-1')

    expect(localStorage.getItem(buildCityListStorageKey('u-1'))).toBeNull()
    expect(localStorage.getItem(buildCityListStorageKey('u-2'))).not.toBeNull()
  })

  it('ensureCitiesLoaded should keep the logout state empty when no user is logged in', async () => {
    mockedGetCityList.mockResolvedValue(sampleResponse)
    const store = useCityStore()

    await store.ensureCitiesLoaded()

    expect(mockedGetCityList).not.toHaveBeenCalled()
    expect(store.cities).toEqual([])
  })
})
