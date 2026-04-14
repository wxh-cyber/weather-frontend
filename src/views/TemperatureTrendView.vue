<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TemperatureTrendPanel from '@/components/weather/TemperatureTrendPanel.vue'
import { useCityStore } from '@/store/city'

const route = useRoute()
const cityStore = useCityStore()

const routeCityName = computed(() => String(route.params.cityName ?? ''))
const selectedCity = computed(() => cityStore.cities.find((city) => city.cityName === routeCityName.value) ?? null)

onMounted(async () => {
  await cityStore.ensureCitiesLoaded()
})
</script>

<template>
  <TemperatureTrendPanel
    :city-name="routeCityName"
    :temperature="selectedCity?.temperature"
  />
</template>
