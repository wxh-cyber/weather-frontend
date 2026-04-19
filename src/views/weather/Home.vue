<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { weatherSearchSubmitKey, type WeatherSearchSubmitHandler } from '@/layout/helpers/weatherSearch'
import WeatherPageShell from '@/components/weather/WeatherPageShell.vue'
import WeatherCityOverview from '@/components/weather/WeatherCityOverview.vue'
import { useCityStore } from '@/store/city'

const router = useRouter()
const cityStore = useCityStore()
const selectedCityName = ref('')
const weatherSearchSubmit = inject<WeatherSearchSubmitHandler | undefined>(weatherSearchSubmitKey, undefined)
const navItems = [
  { key: 'overview', label: '城市概览' },
  { key: 'temperature-trend', label: '温度趋势' },
  { key: 'weather-map', label: '天气地图' },
  { key: 'hourly-forecast', label: '每小时预报', disabled: true },
] as const

const defaultCity = computed(() => cityStore.cities[0] ?? null)
const cities = computed(() => cityStore.cities)
const selectedCity = computed(
  () => cityStore.cities.find((city) => city.cityName === selectedCityName.value) ?? defaultCity.value,
)

const syncSelectedCity = () => {
  const currentName = selectedCityName.value.trim()
  const hasCurrentCity = cityStore.cities.some((city) => city.cityName === currentName)

  if (hasCurrentCity) {
    return
  }

  selectedCityName.value = defaultCity.value?.cityName ?? ''
}

watch(() => cityStore.cities, syncSelectedCity, { deep: true, immediate: true })

onMounted(async () => {
  await cityStore.ensureCitiesLoaded()
  syncSelectedCity()
})

const handleCitySelect = (cityName: string) => {
  selectedCityName.value = cityName
}

const handleNavSelect = (navKey: string) => {
  const currentCityName = selectedCity.value?.cityName
  if (!currentCityName) {
    return
  }

  if (navKey === 'temperature-trend') {
    void router.push(`/weather/${encodeURIComponent(currentCityName)}/temperature-trend`)
    return
  }

  if (navKey === 'weather-map') {
    void router.push(`/weather/${encodeURIComponent(currentCityName)}/map`)
    return
  }

  if (navKey === 'overview') {
    void router.push(`/weather/${encodeURIComponent(currentCityName)}`)
  }
}

const handleSearchSubmit = (keyword: string) => {
  if (!weatherSearchSubmit) {
    return
  }

  void weatherSearchSubmit(keyword)
}
</script>

<template>
  <WeatherPageShell :city-name="selectedCity?.cityName ?? ''" :weather-text="selectedCity?.weatherText ?? ''">
    <template v-if="selectedCity">
      <WeatherCityOverview
        :nav-items="navItems"
        active-nav-key="overview"
        :cities="cities"
        :default-city-name="defaultCity?.cityName ?? ''"
        :selected-city-name="selectedCity.cityName"
        :temperature="selectedCity.temperature"
        :weather-text="selectedCity.weatherText"
        @city-select="handleCitySelect"
        @nav-select="handleNavSelect"
        @search-submit="handleSearchSubmit"
      />
    </template>
    <template v-else>
      <section class="weather-empty-state">
        <p class="weather-empty-state__kicker">DEFAULT CITY OFFLINE</p>
        <h1 class="weather-empty-state__title">当前城市列表中还没有任何城市</h1>
        <p class="weather-empty-state__text">请先前往“我的城市”添加城市，完成后再返回此页面查看天气信息。</p>
      </section>
    </template>
  </WeatherPageShell>
</template>

<style scoped>
.weather-empty-state {
  padding: 32px 28px;
  border: 1px solid rgba(117, 241, 255, 0.26);
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(117, 241, 255, 0.08), transparent 32%),
    linear-gradient(140deg, rgba(7, 24, 56, 0.84), rgba(4, 16, 38, 0.76));
  box-shadow:
    inset 0 1px 0 rgba(180, 252, 255, 0.1),
    inset 0 0 20px rgba(117, 241, 255, 0.1),
    var(--cyber-glow-md);
  backdrop-filter: blur(6px);
}

.weather-empty-state__kicker {
  margin: 0 0 10px;
  color: rgba(117, 241, 255, 0.62);
  font-size: 11px;
  letter-spacing: 0.22em;
}

.weather-empty-state__title {
  margin: 0;
  color: var(--cyber-cyan);
  font-size: 28px;
  letter-spacing: 0.06em;
  text-shadow:
    0 0 12px rgba(117, 241, 255, 0.45),
    0 0 22px rgba(255, 82, 205, 0.12);
}

.weather-empty-state__text {
  margin: 14px 0 0;
  max-width: 520px;
  color: rgba(210, 241, 255, 0.74);
  line-height: 1.7;
}

@media (max-width: 640px) {
  .weather-empty-state {
    padding: 24px 18px;
  }

  .weather-empty-state__title {
    font-size: 22px;
  }
}
</style>
