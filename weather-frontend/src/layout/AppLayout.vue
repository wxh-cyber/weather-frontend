<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppTopNav from '@/layout/AppTopNav.vue'
import CyberCursorOverlay from '@/layout/CyberCursorOverlay.vue'
import { getProfile } from '@/service/auth'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isLoggedIn, displayName } = storeToRefs(authStore)

const syncUserStatus = () => {
  authStore.syncFromStorage()
}

const clearAuthState = () => {
  authStore.clearAuth()
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
const loginLabel = computed(() => displayName.value)

const goToLogin = async () => {
  syncUserStatus()
  if (isLoggedIn.value) {
    try {
      await getProfile()
      await router.push('/center')
      return
    } catch {
      clearAuthState()
      ElMessage.warning('登录已过期，请重新登录')
      await router.push('/login')
      return
    }
  }
  await router.push('/login')
}

const handleLogout = async () => {
  clearAuthState()
  ElMessage.success('已退出登录')
  if (route.name === 'center' || route.name === 'list') {
    await router.push('/login')
  }
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
      :show-logout="isLoggedIn"
      @login-click="goToLogin"
      @my-cities-click="goToList"
      @logout-click="handleLogout"
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
