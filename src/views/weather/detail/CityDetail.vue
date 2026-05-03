<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import WeatherPageShell from '@/components/weather/shell/WeatherPageShell.vue'
import { useCityStore } from '@/store/city'
import { isEquivalentCityName } from '@/utils/weather/cityNameDisplay'

const route = useRoute()
const cityStore = useCityStore()

const routeCityName = computed(() => String(route.params.cityName ?? ''))
const selectedCity = computed(
  () => cityStore.cities.find((city) => isEquivalentCityName(city.cityName, routeCityName.value)) ?? null,
)

onMounted(async () => {
  await cityStore.ensureCitiesLoaded()
})
</script>

<template>
  <WeatherPageShell :city-name="selectedCity?.cityName ?? ''" :weather-text="selectedCity?.weatherText ?? ''">
    <RouterView />
  </WeatherPageShell>
</template>
