<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppTopNav from '@/layout/AppTopNav.vue'
import CyberCursorOverlay from '@/layout/CyberCursorOverlay.vue'

const route = useRoute()
const router = useRouter()
const navVariant = computed(() => {
  if (route.meta.navVariant === 'start' || route.name === 'start') return 'start'
  return 'home'
})
const brandText = computed(() => (navVariant.value === 'start' ? '小慕天气' : '小慕天气 · 控制台'))
const showCenterSearch = computed(() => navVariant.value === 'home')

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <AppTopNav :brand-text="brandText" :show-center-search="showCenterSearch" @login-click="goToLogin" />
    <main class="app-main">
      <RouterView />
    </main>
    <CyberCursorOverlay />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--cyber-bg-deep);
}

.app-main {
  min-height: calc(100vh - var(--app-nav-height));
  padding-top: var(--app-nav-height);
}

@media (max-width: 640px) {
  .app-main {
    min-height: calc(100vh - var(--app-nav-height-mobile));
    padding-top: var(--app-nav-height-mobile);
  }
}
</style>
