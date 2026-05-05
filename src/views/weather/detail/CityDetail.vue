<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import WeatherPageShell from '@/components/weather/shell/WeatherPageShell.vue'
import { useCityStore } from '@/store/city'
import { isEquivalentCityName } from '@/utils/weather/cityNameDisplay'

const route = useRoute()
const cityStore = useCityStore()
const citiesLoaded = ref(false)

const routeCityName = computed(() => String(route.params.cityName ?? ''))
const selectedCity = computed(
  () => cityStore.cities.find((city) => isEquivalentCityName(city.cityName, routeCityName.value)) ?? null,
)
const showEmptyState = computed(() => citiesLoaded.value && (!cityStore.cities.length || !selectedCity.value))

onMounted(async () => {
  await cityStore.ensureCitiesLoaded({ requireWeatherBundle: true })
  citiesLoaded.value = true
})
</script>

<template>
  <WeatherPageShell :city-name="selectedCity?.cityName ?? ''" :weather-text="selectedCity?.weatherText ?? ''">
    <section v-if="showEmptyState" class="city-empty-state">
      <p>暂无城市天气数据</p>
    </section>
    <RouterView v-else />
  </WeatherPageShell>
</template>

<style scoped>
.city-empty-state {
  min-height: 360px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 16px;
}
</style>
