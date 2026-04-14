<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WeatherCityOverview from '@/components/weather/WeatherCityOverview.vue'
import { useCityStore } from '@/store/city'

const route = useRoute()
const router = useRouter()
const cityStore = useCityStore()
const menus = ['发现', '天气', '地图', '每小时预报', '月度天气', '天气趋势', '台风']
const selectedCityName = ref('')

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

watch(routeCityName, (nextCityName) => {
  selectedCityName.value = nextCityName
})
watch(() => cityStore.cities, syncSelectedCity, { deep: true, immediate: true })

onMounted(async () => {
  await cityStore.ensureCitiesLoaded()
  syncSelectedCity()
})

const handleCitySelect = (cityName: string) => {
  if (routeCityName.value === cityName && route.name === 'city-detail') {
    return
  }

  void router.push({
    name: 'city-detail',
    params: { cityName },
  })
}
</script>

<template>
  <WeatherCityOverview
    v-if="selectedCity"
    :menus="menus"
    :cities="cityStore.cities"
    :default-city-name="cityStore.cities[0]?.cityName ?? ''"
    :selected-city-name="selectedCity.cityName"
    :temperature="selectedCity.temperature"
    :weather-text="selectedCity.weatherText"
    @city-select="handleCitySelect"
  />
</template>
