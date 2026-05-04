import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent, ref } from 'vue'
import { weatherSearchSubmitKey } from '@/layout/helpers/weatherSearch'
import DailyWeatherView from '@/views/weather/detail/DailyWeatherView.vue'
import { useCityStore } from '@/store/city'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/store/auth'

describe('DailyWeatherView', () => {
  const WeatherDetailHeaderStub = defineComponent({
    props: {
      navItems: {
        type: Array,
        required: true,
      },
      activeNavKey: {
        type: String,
        required: true,
      },
    },
    emits: ['nav-select', 'search-submit'],
    setup(_, { emit }) {
      const keyword = ref('')
      return {
        keyword,
        emit,
      }
    },
    template: `
      <header class="weather-detail-header-stub">
        <span class="shared-header-signature">shared-weather-detail-header</span>
        <span class="shared-active-nav">{{ activeNavKey }}</span>
        <nav class="shared-nav-row" data-testid="weather-detail-header-nav">
          <button
            v-for="item in navItems"
            :key="item.key"
            class="menu-button"
            @click="emit('nav-select', item.key)"
          >
            {{ item.label }}
          </button>
        </nav>
        <input
          v-model="keyword"
          class="shared-search-input"
          placeholder="搜索城市"
          @input="keyword = $event.target.value"
          @keydown.enter="emit('search-submit', keyword)"
        />
      </header>
    `,
  })

  beforeEach(() => {
    localStorage.clear()
  })

  const mountDailyView = async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'test-token')
    localStorage.setItem(
      AUTH_USER_KEY,
      JSON.stringify({
        userId: 'test-user',
        email: 'tester@example.com',
      }),
    )

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/weather/:cityName', name: 'city-detail', component: { template: '<div />' } },
        { path: '/weather/:cityName/temperature-trend', name: 'city-temperature-trend', component: { template: '<div />' } },
        { path: '/weather/:cityName/map', name: 'city-weather-map', component: { template: '<div />' } },
        { path: '/weather/:cityName/daily-weather', name: 'city-daily-weather', component: DailyWeatherView },
      ],
    })

    await router.push('/weather/武汉市/daily-weather')
    await router.isReady()

    const pinia = createPinia()
    setActivePinia(pinia)
    const cityStore = useCityStore(pinia)
    cityStore.setCities([
      { cityId: 'city-1', cityName: '武汉市', province: '湖北省', latitude: 30.5928, longitude: 114.3055, weatherText: '晴', temperature: '26°C' },
      { cityId: 'city-2', cityName: '上海市', province: '上海市', latitude: 31.2304, longitude: 121.4737, weatherText: '多云', temperature: '22°C' },
    ])
    const searchSubmitMock = vi.fn()

    const wrapper = mount(DailyWeatherView, {
      global: {
        plugins: [pinia, router],
        provide: {
          [weatherSearchSubmitKey]: searchSubmitMock,
        },
        stubs: {
          'el-icon': {
            template: '<span><slot /></span>',
          },
          WeatherDetailHeader: WeatherDetailHeaderStub,
          WeatherCityTabs: {
            emits: ['select'],
            template: '<div class="weather-city-tabs-stub" @click="$emit(\'select\', \'上海市\')" />',
          },
          DailyWeatherPanel: {
            props: ['city', 'initialDate'],
            template: '<section class="daily-weather-panel-stub" :data-city-name="city.cityName" :data-initial-date="initialDate" />',
          },
        },
      },
    })

    await flushPromises()
    return { wrapper, router, searchSubmitMock }
  }

  it('renders the daily weather route with the selected city and updated navigation label', async () => {
    const { wrapper, router } = await mountDailyView()

    expect(router.currentRoute.value.name).toBe('city-daily-weather')
    expect(wrapper.text()).toContain('单日天气')
    expect(wrapper.find('.weather-detail-header-stub').exists()).toBe(true)
    expect(wrapper.find('.shared-header-signature').text()).toBe('shared-weather-detail-header')
    expect(wrapper.find('[data-testid="weather-detail-header-nav"]').exists()).toBe(true)
    expect(wrapper.findAll('.menu-button')).toHaveLength(4)
    expect(wrapper.find('.shared-active-nav').text()).toBe('daily-weather')
    expect(wrapper.find('.daily-weather-panel-stub').attributes('data-city-name')).toBe('武汉市')
  })

  it('navigates back to overview and forwards search submissions', async () => {
    const { wrapper, router, searchSubmitMock } = await mountDailyView()

    const navButtons = wrapper.findAll('.menu-button')
    await navButtons[0]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('city-detail')

    await router.push('/weather/武汉市/daily-weather')
    await flushPromises()

      const searchInput = wrapper.get('.shared-search-input')
      await searchInput.setValue('广州')
    await searchInput.trigger('keydown.enter')
    await flushPromises()

    expect(searchSubmitMock).toHaveBeenCalledWith('广州')
  })

  it('passes the selected route date query to the daily panel', async () => {
    const { wrapper, router } = await mountDailyView()

    await router.push('/weather/武汉市/daily-weather?date=2026-05-03')
    await flushPromises()

    expect(wrapper.find('.daily-weather-panel-stub').attributes('data-initial-date')).toBe('2026-05-03')
  })
})
