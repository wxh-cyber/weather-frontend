import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WeatherDetailHeader from '@/components/weather/shell/WeatherDetailHeader.vue'

describe('WeatherDetailHeader', () => {
  it('canonicalizes city names before emitting search submissions', async () => {
    const wrapper = mount(WeatherDetailHeader, {
      props: {
        navItems: [
          { key: 'overview', label: '城市概览' },
        ],
        activeNavKey: 'overview',
      },
      global: {
        stubs: {
          'el-icon': {
            template: '<span><slot /></span>',
          },
        },
      },
    })

    const searchInput = wrapper.get('input[placeholder="搜索城市"]')
    await searchInput.setValue('广州')
    await searchInput.trigger('keydown.enter')

    expect(wrapper.emitted('search-submit')?.[0]).toEqual(['广州市'])
    expect((searchInput.element as HTMLInputElement).value).toBe('广州市')
  })
})
