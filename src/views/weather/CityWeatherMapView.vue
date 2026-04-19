<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WeatherCityTabs from '@/components/weather/WeatherCityTabs.vue'
import WeatherMapExplorer from '@/components/weather/WeatherMapExplorer.vue'
import { weatherSearchSubmitKey, type WeatherSearchSubmitHandler } from '@/layout/helpers/weatherSearch'
import { useCityStore } from '@/store/city'

const route = useRoute()
const router = useRouter()
const cityStore = useCityStore()
const selectedCityName = ref('')
const searchKeyword = ref('')
const weatherSearchSubmit = inject<WeatherSearchSubmitHandler | undefined>(weatherSearchSubmitKey, undefined)

const navItems: ReadonlyArray<{
  key: string
  label: string
  disabled?: boolean
}> = [
  { key: 'overview', label: '城市概览' },
  { key: 'temperature-trend', label: '温度趋势' },
  { key: 'weather-map', label: '天气地图' },
  { key: 'hourly-forecast', label: '每小时预报', disabled: true },
]

const routeCityName = computed(() => String(route.params.cityName ?? ''))
const selectedCity = computed(
  () => cityStore.cities.find((city) => city.cityName === selectedCityName.value)
    ?? cityStore.cities.find((city) => city.cityName === routeCityName.value)
    ?? null,
)

const syncSelectedCity = () => {
  const currentName = selectedCityName.value.trim()
  const hasCurrentCity = cityStore.cities.some((city) => city.cityName === currentName)
  if (hasCurrentCity) {
    return
  }

  selectedCityName.value = routeCityName.value
}

const submitSearch = () => {
  if (!weatherSearchSubmit) {
    return
  }

  void weatherSearchSubmit(searchKeyword.value.trim())
}

watch(routeCityName, (nextCityName) => {
  selectedCityName.value = nextCityName
})
watch(() => cityStore.cities, syncSelectedCity, { deep: true, immediate: true })

onMounted(async () => {
  await cityStore.ensureCitiesLoaded()
  syncSelectedCity()
})

const handleCitySelect = (cityName: string) => {
  if (routeCityName.value === cityName && route.name === 'city-weather-map') {
    return
  }

  void router.push({
    name: 'city-weather-map',
    params: { cityName },
  })
}

const handleNavSelect = (navKey: string) => {
  if (!routeCityName.value) {
    return
  }

  if (navKey === 'overview') {
    void router.push({
      name: 'city-detail',
      params: { cityName: routeCityName.value },
    })
    return
  }

  if (navKey === 'temperature-trend') {
    void router.push({
      name: 'city-temperature-trend',
      params: { cityName: routeCityName.value },
    })
  }
}
</script>

<template>
  <section v-if="selectedCity" class="map-view">
    <header class="dashboard-head">
      <div class="dashboard-head__inner">
        <nav class="menu" aria-label="城市详情导航">
          <button
            v-for="item in navItems"
            :key="item.key"
            type="button"
            class="menu-button"
            :class="{
              'is-current': item.key === 'weather-map',
              'is-disabled': item.disabled,
            }"
            :disabled="item.disabled"
            @click="handleNavSelect(item.key)"
          >
            <span class="menu-button__label">{{ item.label }}</span>
          </button>
        </nav>

        <div class="dashboard-search">
          <div class="search-wrap">
            <input
              v-model="searchKeyword"
              class="search"
              type="text"
              placeholder="搜索城市"
              @keydown.enter="submitSearch"
            />
            <button
              type="button"
              class="search-trigger"
              aria-label="搜索城市"
              @click="submitSearch"
            >
              <el-icon class="search-icon"><Search /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </header>

    <WeatherCityTabs
      :cities="cityStore.cities"
      :default-city-name="cityStore.cities[0]?.cityName ?? ''"
      :selected-city-name="selectedCity.cityName"
      @select="handleCitySelect"
    />

    <WeatherMapExplorer
      :city-name="selectedCity.cityName"
      :weather-text="selectedCity.weatherText"
      :province="selectedCity.province"
      :country="selectedCity.country"
      :latitude="selectedCity.latitude"
      :longitude="selectedCity.longitude"
    />
  </section>
</template>

<style scoped>
.map-view {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.dashboard-head {
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background: linear-gradient(140deg, rgba(7, 24, 56, 0.8), rgba(4, 16, 38, 0.72));
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.12),
    var(--cyber-glow-md);
  backdrop-filter: blur(6px);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
}

.dashboard-head__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
}

.menu {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.menu-button {
  position: relative;
  min-width: 132px;
  padding: 10px 18px;
  border: 1px solid rgba(117, 241, 255, 0.24);
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(5, 26, 60, 0.88), rgba(3, 14, 36, 0.92)),
    rgba(4, 14, 34, 0.9);
  color: rgba(214, 242, 255, 0.82);
  font-size: 13px;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.menu-button.is-current {
  color: #03121d;
  border-color: rgba(117, 241, 255, 0.7);
  background:
    linear-gradient(135deg, rgba(117, 241, 255, 0.96), rgba(153, 251, 255, 0.86)),
    rgba(117, 241, 255, 0.96);
  box-shadow:
    inset 0 0 18px rgba(255, 255, 255, 0.2),
    0 0 22px rgba(117, 241, 255, 0.28);
}

.menu-button.is-disabled {
  opacity: 0.44;
  cursor: not-allowed;
}

.menu-button__label {
  position: relative;
  z-index: 1;
}

.dashboard-search {
  justify-self: end;
  width: min(320px, 100%);
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(117, 241, 255, 0.28);
  background:
    linear-gradient(135deg, rgba(6, 24, 54, 0.84), rgba(3, 12, 28, 0.96)),
    rgba(4, 12, 28, 0.92);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.08),
    0 0 20px rgba(117, 241, 255, 0.08);
}

.search {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: rgba(230, 248, 255, 0.92);
  font-size: 14px;
  outline: none;
}

.search::placeholder {
  color: rgba(173, 213, 255, 0.42);
}

.search-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(117, 241, 255, 0.22);
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(117, 241, 255, 0.22), rgba(255, 82, 205, 0.18));
  color: var(--cyber-cyan);
  cursor: pointer;
}

.search-icon {
  font-size: 16px;
}

@media (max-width: 940px) {
  .dashboard-head__inner {
    grid-template-columns: 1fr;
  }

  .dashboard-search {
    justify-self: stretch;
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-head {
    animation: none;
  }
}
</style>
