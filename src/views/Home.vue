<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import WeatherPageShell from '@/components/weather/WeatherPageShell.vue'
import WeatherCityOverview from '@/components/weather/WeatherCityOverview.vue'
import { useCityStore } from '@/store/city'

const cityStore = useCityStore()
const menus = ['发现', '天气', '地图', '每小时预报', '月度天气', '天气趋势', '台风']
const selectedCityName = ref('')

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
</script>

<template>
  <WeatherPageShell :city-name="selectedCity?.cityName ?? ''">
    <template v-if="selectedCity">
      <WeatherCityOverview
        :menus="menus"
        :cities="cities"
        :default-city-name="defaultCity?.cityName ?? ''"
        :selected-city-name="selectedCity.cityName"
        :temperature="selectedCity.temperature"
        :weather-text="selectedCity.weatherText"
        @city-select="handleCitySelect"
      />
    </template>
    <template v-else>
      <section class="weather-empty-state">
        <p class="weather-empty-state__kicker">DEFAULT CITY OFFLINE</p>
        <h1 class="weather-empty-state__title">当前账户还没有可展示的城市</h1>
        <p class="weather-empty-state__text">请先前往“我的城市”添加城市或设置默认城市，然后再进行天气查询。</p>
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
