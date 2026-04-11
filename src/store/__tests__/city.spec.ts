import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCityStore } from '@/store/city'
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
    mockedGetCityList.mockResolvedValue(sampleResponse)

    const store = useCityStore()
    await store.fetchCities('武汉')

    expect(mockedGetCityList).toHaveBeenCalledWith('武汉')
    expect(store.error).toBe('')
    expect(store.loading).toBe(false)
    expect(store.cities).toEqual(sampleResponse.data)
    expect(localStorage.getItem('city_list')).toBe(JSON.stringify(sampleResponse.data))
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
    mockedGetCityList.mockResolvedValue(sampleResponse)
    const store = useCityStore()

    await store.ensureCitiesLoaded()

    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(store.cities).toEqual(sampleResponse.data)
  })

  it('createCityByName should fail when duplicated name exists in pinia', async () => {
    const store = useCityStore()
    store.setCities([{ cityName: '武汉市', weatherText: '晴', temperature: '20°C' }])

    const result = await store.createCityByName('武汉市')

    expect(result).toBe(false)
    expect(mockedCreateCity).not.toHaveBeenCalled()
    expect(store.error).toContain('已存在')
  })

  it('createCityByName should call backend and update list when success', async () => {
    mockedCreateCity.mockResolvedValue(sampleResponse)
    const store = useCityStore()

    const result = await store.createCityByName('武汉市')

    expect(result).toBe(true)
    expect(mockedCreateCity).toHaveBeenCalledWith('武汉市')
    expect(store.cities).toEqual(sampleResponse.data)
  })

  it('renameCity should fallback fetch when source not found in pinia', async () => {
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
    const store = useCityStore()
    store.setCities(sampleResponse.data)

    const result = await store.renameCity('武汉市', '上海市')

    expect(result).toBe(false)
    expect(mockedUpdateCity).not.toHaveBeenCalled()
    expect(store.error).toContain('已存在')
  })

  it('deleteCityByName should fail when city not found after fallback', async () => {
    mockedGetCityList.mockResolvedValue(sampleResponse)
    const store = useCityStore()

    const result = await store.deleteCityByName('不存在城市')

    expect(result).toBe(false)
    expect(mockedGetCityList).toHaveBeenCalledWith('')
    expect(mockedDeleteCity).not.toHaveBeenCalled()
    expect(store.error).toContain('未找到')
  })

  it('deleteCityByName should call backend and update list when success', async () => {
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
})
