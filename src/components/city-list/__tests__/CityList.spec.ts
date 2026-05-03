import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CityList from '@/components/city-list/CityList.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('CityList', () => {
  it('renders city cards with weather text and temperature', () => {
    const wrapper = mount(CityList, {
      props: {
        items: [
          { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
          { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
        ],
      },
    })

    expect(wrapper.findAll('.city-item')).toHaveLength(2)
    expect(wrapper.text()).toContain('武汉市')
    expect(wrapper.text()).toContain('26°C')
    expect(wrapper.text()).toContain('多云')
  })

  it('marks the first card as default city', () => {
    const wrapper = mount(CityList, {
      props: {
        items: [
          { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
          { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
          { cityName: '北京市', weatherText: '小雨', temperature: '19°C' },
        ],
      },
    })

    const cards = wrapper.findAll('.city-item')
    expect(cards[0]?.classes()).toContain('is-default')
    expect(cards[1]?.classes()).not.toContain('is-default')
    expect(cards[2]?.classes()).not.toContain('is-default')
    expect(cards[0]?.find('.default-chip').text()).toContain('默认城市')
  })

  it('maps weather text to svg icons', () => {
    const wrapper = mount(CityList, {
      props: {
        items: [
          { cityName: 'A市', weatherText: '晴', temperature: '20°C' },
          { cityName: 'B市', weatherText: '多云', temperature: '21°C' },
          { cityName: 'C市', weatherText: '小雨', temperature: '18°C' },
          { cityName: 'D市', weatherText: '未知现象', temperature: '17°C' },
        ],
      },
    })

    const icons = wrapper.findAll('.weather-icon')
    expect(icons[0]?.attributes('alt')).toBe('晴天图标')
    expect(icons[1]?.attributes('alt')).toBe('晴间多云图标')
    expect(icons[2]?.attributes('alt')).toBe('雨天图标')
    expect(icons[3]?.attributes('alt')).toBe('未知天气图标')
  })

  it('displays canonical full city names for configured aliases', () => {
    const wrapper = mount(CityList, {
      props: {
        items: [
          { cityName: '广州', weatherText: '晴', temperature: '29°C' },
        ],
      },
    })

    expect(wrapper.find('.city-name').text()).toBe('广州市')
  })
})
