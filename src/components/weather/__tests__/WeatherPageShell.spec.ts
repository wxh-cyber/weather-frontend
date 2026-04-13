import { defineComponent, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WeatherPageShell from '@/components/weather/WeatherPageShell.vue'

const resolveCityBackgroundMock = vi.fn()
const getCityBackgroundVariantMock = vi.fn()

vi.mock('@/utils/cityBackgrounds', () => ({
  resolveCityBackground: (...args: unknown[]) => resolveCityBackgroundMock(...args),
  getCityBackgroundVariant: (...args: unknown[]) => getCityBackgroundVariantMock(...args),
}))

const TransitionStub = defineComponent({
  template: '<slot />',
})

describe('WeatherPageShell', () => {
  it('renders background layer and internal scroll container when city has background', () => {
    resolveCityBackgroundMock.mockReturnValue('/assets/wuhan-day.jpg')
    getCityBackgroundVariantMock.mockReturnValue('day')

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '武汉市',
      },
      slots: {
        default: '<section class="shell-content">天气内容</section>',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    const backgroundLayer = wrapper.find('[data-background-key="武汉市:day:/assets/wuhan-day.jpg"]')
    expect(backgroundLayer.exists()).toBe(true)
    expect(backgroundLayer.attributes('style')).toContain('/assets/wuhan-day.jpg')
    expect(wrapper.find('[data-testid="weather-page-scroll"]').exists()).toBe(true)
    expect(wrapper.find('.shell-content').exists()).toBe(true)
  })

  it('updates background key when selected city changes', async () => {
    resolveCityBackgroundMock.mockImplementation((cityName: string) =>
      cityName === '武汉市' ? '/assets/wuhan-day.jpg' : '/assets/nanchang-day.jpg',
    )
    getCityBackgroundVariantMock.mockReturnValue('day')

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '武汉市',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    expect(wrapper.find('[data-background-key="武汉市:day:/assets/wuhan-day.jpg"]').exists()).toBe(true)

    await wrapper.setProps({
      cityName: '南昌市',
    })
    await nextTick()

    expect(wrapper.find('[data-background-key="南昌市:day:/assets/nanchang-day.jpg"]').exists()).toBe(true)
  })

  it('falls back to empty background key when no background exists', () => {
    resolveCityBackgroundMock.mockReturnValue('')
    getCityBackgroundVariantMock.mockReturnValue('night')

    const wrapper = mount(WeatherPageShell, {
      props: {
        cityName: '不存在城市',
      },
      global: {
        stubs: {
          Transition: TransitionStub,
        },
      },
    })

    expect(wrapper.find('[data-background-key="empty"]').exists()).toBe(true)
  })
})
