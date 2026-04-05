<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppTopNav from '@/layout/AppTopNav.vue'
import CyberCursorOverlay from '@/layout/CyberCursorOverlay.vue'

const route = useRoute()
const router = useRouter()
const userName = ref('未登录')

const syncUserStatus = () => {
  const raw = localStorage.getItem('auth_user')
  if (!raw) {
    userName.value = '未登录'
    return
  }

  try {
    const parsed = JSON.parse(raw) as { nickname?: string; email?: string }
    userName.value = parsed.nickname || parsed.email || '已登录'
  } catch {
    userName.value = '已登录'
  }
}

watch(
  () => route.fullPath,
  () => {
    syncUserStatus()
  },
  { immediate: true },
)
window.addEventListener('auth-user-updated', syncUserStatus as EventListener)
window.addEventListener('storage', syncUserStatus)
onBeforeUnmount(() => {
  window.removeEventListener('auth-user-updated', syncUserStatus as EventListener)
  window.removeEventListener('storage', syncUserStatus)
})

const navVariant = computed(() => {
  if (route.meta.navVariant === 'start' || route.name === 'start') return 'start'
  return 'home'
})
const brandText = computed(() => (navVariant.value === 'start' ? '小慕天气' : '小慕天气 · 控制台'))
const showCenterSearch = computed(() => navVariant.value === 'home' && route.name !== 'center')
const showMyCities = computed(() => route.name === 'center')
const loginLabel = computed(() => userName.value)

const goToLogin = () => {
  syncUserStatus()
  if (localStorage.getItem('auth_token')) {
    router.push('/center')
    return
  }
  router.push('/login')
}

const goToList = () => {
  router.push('/list')
}
</script>

<template>
  <div class="app-layout">
    <AppTopNav
      :brand-text="brandText"
      :show-center-search="showCenterSearch"
      :show-my-cities="showMyCities"
      :login-label="loginLabel"
      @login-click="goToLogin"
      @my-cities-click="goToList"
    />
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
