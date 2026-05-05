import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/store/auth'
import { useCityStore } from '@/store/city'
import { buildCityListStorageKey, clearPersistedCitiesForUserId } from '@/store/city'
import { createCity, deleteCity, deleteUserCities, deleteUserCity, getCityList, type CityListResponse, updateCity } from '@/service/city'

vi.mock('@/service/city', () => ({
  getCityList: vi.fn(),
  createCity: vi.fn(),
  updateCity: vi.fn(),
  deleteCity: vi.fn(),
  deleteUserCity: vi.fn(),
  deleteUserCities: vi.fn(),
}))

const mockedGetCityList = vi.mocked(getCityList)
const mockedCreateCity = vi.mocked(createCity)
const mockedUpdateCity = vi.mocked(updateCity)
const mockedDeleteCity = vi.mocked(deleteCity)
const mockedDeleteUserCity = vi.mocked(deleteUserCity)
const mockedDeleteUserCities = vi.mocked(deleteUserCities)

const sampleResponse: CityListResponse = {
  code: 0,
  message: '获取成功',
  data: [
    { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
    { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
  ],
}

const completeWeatherBundle = {
  current: {
    cityId: 'city-1',
    cityName: '武汉市',
    weatherText: '小雨',
    temperature: '24°C',
    observedAt: '2026-05-04T08:00',
    source: 'open-meteo',
  },
  hourly: {
    cityId: 'city-1',
    cityName: '武汉市',
    source: 'open-meteo',
    items: [
      {
        time: '2026-05-04T09:00',
        weatherText: '小雨',
        temperature: '25°C',
      },
    ],
  },
  daily: {
    cityId: 'city-1',
    cityName: '武汉市',
    source: 'open-meteo',
    items: [
      {
        date: '2026-05-04',
        weatherText: '小雨',
        temperatureMax: '28°C',
        temperatureMin: '21°C',
      },
    ],
  },
  dailyDetail: {
    cityId: 'city-1',
    cityName: '武汉市',
    source: 'open-meteo',
    items: [
      {
        date: '2026-05-04',
        temperatureMax: '28°C',
        temperatureMin: '21°C',
        sunrise: '05:36',
        sunset: '19:01',
        dayWeatherText: '小雨',
        nightWeatherText: '多云',
        dayMetrics: {
          feelsLike: '29°C',
          precipitationProbability: '35%',
          precipitationAmount: '0.8 mm',
          airQuality: 'AQI 42',
          windDirection: '东北',
          cloudCover: '62%',
        },
        nightMetrics: {
          feelsLike: '23°C',
          precipitationProbability: '20%',
          precipitationAmount: '0.2 mm',
          airQuality: 'AQI 39',
          windDirection: '东南',
          cloudCover: '48%',
        },
      },
    ],
  },
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
    mockedDeleteUserCity.mockReset()
    mockedDeleteUserCities.mockReset()
  })

  it('fetchCities should update city list and persist when success', async () => {
    loginAs()
    mockedGetCityList.mockResolvedValue(sampleResponse)

    const store = useCityStore()
    await store.fetchCities('武汉')

    expect(mockedGetCityList).toHaveBeenCalledWith('武汉市')
    expect(store.error).toBe('')
    expect(store.loading).toBe(false)
    expect(store.cities).toEqual(sampleResponse.data)
    expect(localStorage.getItem(buildCityListStorageKey('u-1'))).toBe(JSON.stringify(sampleResponse.data))
  })

  it('fetchCities should canonicalize broader administrative keywords before request', async () => {
    loginAs()
    mockedGetCityList.mockResolvedValue(sampleResponse)

    const store = useCityStore()
    await store.fetchCities('香港')

    expect(mockedGetCityList).toHaveBeenCalledWith('香港特别行政区')
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

  it('ensureCitiesLoaded should refresh when detail page requires weather bundle and current cities lack it', async () => {
    loginAs()
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [
        {
          cityId: 'city-1',
          cityName: '武汉市',
          weatherText: '小雨',
          temperature: '24°C',
          weather: completeWeatherBundle,
        },
      ],
    })
    const store = useCityStore()
    store.setCities([{ cityId: 'city-1', cityName: '武汉市', weatherText: '晴', temperature: '26°C' }])

    await store.ensureCitiesLoaded({ requireWeatherBundle: true })

    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(store.cities[0]?.weather?.current.weatherText).toBe('小雨')
    expect(store.cities[0]?.weather?.hourly.items).toHaveLength(1)
    expect(store.cities[0]?.weather?.daily.items).toHaveLength(1)
    expect(store.cities[0]?.weather?.dailyDetail.items).toHaveLength(1)
  })

  it('ensureCitiesLoaded should not refresh when detail page requires weather bundle and all cities already have it', async () => {
    loginAs()
    const store = useCityStore()
    store.setCities([
      {
        cityId: 'city-1',
        cityName: '武汉市',
        weatherText: '小雨',
        temperature: '24°C',
        weather: completeWeatherBundle,
      },
    ])

    await store.ensureCitiesLoaded({ requireWeatherBundle: true })

    expect(mockedGetCityList).not.toHaveBeenCalled()
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

  it('createCityByName should canonicalize district-level names before request', async () => {
    loginAs()
    mockedCreateCity.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [{ cityName: '洪山区', weatherText: '晴', temperature: '26°C' }],
    })
    const store = useCityStore()

    const result = await store.createCityByName('洪山')

    expect(result).toBe(true)
    expect(mockedCreateCity).toHaveBeenCalledWith('洪山区')
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

  it('renameCity should canonicalize special aliases before update request', async () => {
    loginAs()
    mockedUpdateCity.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [{ cityName: '东莞市', weatherText: '多云', temperature: '29°C' }],
    })
    const store = useCityStore()
    store.setCities([{ cityName: '广州市', weatherText: '晴', temperature: '30°C' }])

    const result = await store.renameCity('广州市', '虎门')

    expect(result).toBe(true)
    expect(mockedUpdateCity).toHaveBeenCalledWith('广州市', '东莞市')
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

  it('deleteCityByName should fail when city id is missing after fallback', async () => {
    loginAs()
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [{ cityName: '北京市', weatherText: '晴', temperature: '20°C' }],
    })
    const store = useCityStore()

    const result = await store.deleteCityByName('不存在城市')

    expect(result).toBe(false)
    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(mockedDeleteUserCity).not.toHaveBeenCalled()
    expect(mockedDeleteCity).not.toHaveBeenCalled()
    expect(store.error).toContain('未找到待删除的城市')
  })

  it('deleteCityByName should remove user city by city id and update list when success', async () => {
    loginAs()
    mockedDeleteUserCity.mockResolvedValue({
      ...sampleResponse,
      data: [{ cityName: '上海市', weatherText: '多云', temperature: '22°C' }],
    })
    const store = useCityStore()
    store.setCities([
      { cityId: 'city-1', cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
      { cityId: 'city-2', cityName: '上海市', weatherText: '多云', temperature: '22°C' },
    ])

    const result = await store.deleteCityByName('武汉市')

    expect(result).toBe(true)
    expect(mockedDeleteUserCity).toHaveBeenCalledWith('city-1')
    expect(mockedDeleteCity).not.toHaveBeenCalled()
    expect(store.cities).toEqual([{ cityName: '上海市', weatherText: '多云', temperature: '22°C' }])
  })

  it('deleteCityByName should not depend on current pinia list during sequential deletes', async () => {
    loginAs()
    mockedDeleteUserCity
      .mockResolvedValueOnce({
        ...sampleResponse,
        data: [{ cityId: 'city-2', cityName: '上海市', weatherText: '多云', temperature: '22°C' }],
      })
      .mockResolvedValueOnce({
        ...sampleResponse,
        data: [],
      })
    const store = useCityStore()
    store.setCities([
      { cityId: 'city-1', cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
      { cityId: 'city-2', cityName: '上海市', weatherText: '多云', temperature: '22°C' },
    ])

    const firstResult = await store.deleteCityByName('武汉市')
    store.setCities([{ cityId: 'city-2', cityName: '上海市', weatherText: '多云', temperature: '22°C' }])
    const secondResult = await store.deleteCityByName('上海市')

    expect(firstResult).toBe(true)
    expect(secondResult).toBe(true)
    expect(mockedDeleteUserCity).toHaveBeenNthCalledWith(1, 'city-1')
    expect(mockedDeleteUserCity).toHaveBeenNthCalledWith(2, 'city-2')
    expect(mockedDeleteCity).not.toHaveBeenCalled()
    expect(mockedGetCityList).not.toHaveBeenCalled()
    expect(store.cities).toEqual([])
  })

  it('deleteCitiesByName should delete a snapshot of names through default-city rotation and reconcile with backend', async () => {
    loginAs()
    mockedDeleteUserCities.mockResolvedValue({
      code: 0,
      message: '删除成功',
      data: [],
      failedCityIds: [],
    })
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [],
    })
    const store = useCityStore()
    store.setCities([
      { cityId: 'city-1', cityName: '武汉市', weatherText: '小雨', temperature: '24°C', isDefault: true },
      { cityId: 'city-2', cityName: '上海市', weatherText: '多云', temperature: '22°C', isDefault: false },
      { cityId: 'city-3', cityName: '南昌市', weatherText: '晴', temperature: '28°C', isDefault: false },
    ])

    const result = await store.deleteCitiesByName(['武汉市', '上海市', '南昌市'])

    expect(mockedDeleteUserCities).toHaveBeenCalledWith(['city-1', 'city-2', 'city-3'])
    expect(mockedDeleteUserCity).not.toHaveBeenCalled()
    expect(mockedDeleteCity).not.toHaveBeenCalled()
    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(result).toEqual({
      successCities: ['武汉市', '上海市', '南昌市'],
      failedCities: [],
    })
    expect(store.cities).toEqual([])
    expect(localStorage.getItem(buildCityListStorageKey('u-1'))).toBe('[]')
  })

  it('deleteUserCities service should use the post batch-delete endpoint', async () => {
    loginAs()
    mockedDeleteUserCities.mockResolvedValue({
      code: 0,
      message: '删除成功',
      data: [],
      failedCityIds: [],
    })
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [],
    })
    const store = useCityStore()
    store.setCities([
      { cityId: 'city-1', cityName: '武汉市', weatherText: '小雨', temperature: '24°C', isDefault: true },
      { cityId: 'city-2', cityName: '上海市', weatherText: '多云', temperature: '22°C', isDefault: false },
    ])

    await store.deleteCitiesByName(['武汉市', '上海市'])

    expect(mockedDeleteUserCities).toHaveBeenCalledWith(['city-1', 'city-2'])
  })

  it('deleteCitiesByName should report failed cities and keep final reconciled backend list', async () => {
    loginAs()
    mockedDeleteUserCities.mockResolvedValue({
      code: 0,
      message: '删除成功',
      data: [{ cityId: 'city-2', cityName: '上海市', weatherText: '多云', temperature: '22°C', isDefault: true }],
      failedCityIds: ['city-2'],
    })
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [{ cityName: '上海市', weatherText: '多云', temperature: '22°C', isDefault: true }],
    })
    const store = useCityStore()
    store.setCities([
      { cityId: 'city-1', cityName: '武汉市', weatherText: '小雨', temperature: '24°C', isDefault: true },
      { cityId: 'city-2', cityName: '上海市', weatherText: '多云', temperature: '22°C', isDefault: false },
    ])

    const result = await store.deleteCitiesByName(['武汉市', '上海市'])

    expect(result).toEqual({
      successCities: ['武汉市'],
      failedCities: ['上海市'],
    })
    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(store.cities).toEqual([{ cityName: '上海市', weatherText: '多云', temperature: '22°C', isDefault: true }])
    expect(store.error).toBe('部分城市删除失败')
  })

  it('deleteCitiesByName should refresh once when selected cities lack city id and fail unresolved targets', async () => {
    loginAs()
    mockedGetCityList.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: [{ cityId: 'city-1', cityName: '武汉市', weatherText: '小雨', temperature: '24°C' }],
    })
    mockedDeleteUserCities.mockResolvedValue({
      code: 0,
      message: '删除成功',
      data: [],
      failedCityIds: [],
    })
    const store = useCityStore()
    store.setCities([
      { cityName: '武汉市', weatherText: '小雨', temperature: '24°C' },
      { cityName: '南昌市', weatherText: '晴', temperature: '28°C' },
    ])

    const result = await store.deleteCitiesByName(['武汉市', '南昌市'])

    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(mockedDeleteUserCities).toHaveBeenCalledWith(['city-1'])
    expect(mockedDeleteUserCity).not.toHaveBeenCalled()
    expect(mockedDeleteCity).not.toHaveBeenCalled()
    expect(result).toEqual({
      successCities: ['武汉市'],
      failedCities: ['南昌市'],
    })
    expect(store.error).toContain('未找到待删除的城市')
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
