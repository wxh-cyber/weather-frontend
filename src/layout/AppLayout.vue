<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppTopNav from '@/layout/AppTopNav.vue'
import CyberCursorOverlay from '@/layout/CyberCursorOverlay.vue'
import { getProfile } from '@/service/auth'
import { getCityList, type CityWeatherItem } from '@/service/city'
import { useAuthStore } from '@/store/auth'
import { useCityStore } from '@/store/city'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cityStore = useCityStore()
const { isLoggedIn, displayName, user } = storeToRefs(authStore)

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
const centeredNavRoutes = ['center', 'list', 'login-list'] as const
const showCenterButtons = computed(() =>
  route.name === 'center' || route.name === 'login-list' || route.name === 'list' || route.name === 'weather',
)
const showCenterSearch = computed(() => navVariant.value === 'home' && !centeredNavRoutes.includes(route.name as typeof centeredNavRoutes[number]))
const showMyCities = computed(() => showCenterButtons.value)
const showProfileCenter = computed(() => showCenterButtons.value)
const showLoginList = computed(() => showCenterButtons.value)
const centerNavCentered = computed(() => centeredNavRoutes.includes(route.name as typeof centeredNavRoutes[number]))
const loginLabel = computed(() => displayName.value)
const navAvatarUrl = computed(() => user.value?.avatarUrl || '')
const searchConfirmVisible = ref(false)
const pendingSearchCityName = ref('')
const pendingSearchCityDisplayName = ref('')
const pendingSearchFromCandidate = ref(false)
const activeCenterAction = computed(() =>
  route.name === 'login-list'
    ? 'login-list'
    : route.name === 'center'
      ? 'profile-center'
      : route.name === 'list'
      ? 'my-cities'
      : '',
)
const citySuffixPattern = /(特别行政区|自治州|地区|盟|市|区|县|旗)$/u

const normalizeRawCityName = (cityName: string) => cityName.trim().replace(/\s+/g, '')
const normalizeComparableCityName = (cityName: string) =>
  normalizeRawCityName(cityName).toLocaleLowerCase().replace(citySuffixPattern, '')
const isExactCityMatch = (left: string, right: string) =>
  normalizeRawCityName(left).toLocaleLowerCase() === normalizeRawCityName(right).toLocaleLowerCase()
const isComparableCityMatch = (left: string, right: string) =>
  normalizeComparableCityName(left) === normalizeComparableCityName(right)

const findMatchedCity = (cities: CityWeatherItem[], keyword: string) => {
  const exactMatch = cities.find((city) => isExactCityMatch(city.cityName, keyword))
  if (exactMatch) {
    return exactMatch
  }

  return cities.find((city) => isComparableCityMatch(city.cityName, keyword)) ?? null
}

const resolveSearchCandidate = (cities: CityWeatherItem[], keyword: string) => {
  if (cities.length === 0) {
    return null
  }

  if (cities.length === 1) {
    return cities[0] ?? null
  }

  const exactMatches = cities.filter((city) => isExactCityMatch(city.cityName, keyword))
  if (exactMatches.length === 1) {
    return exactMatches[0] ?? null
  }

  const comparableMatches = cities.filter((city) => isComparableCityMatch(city.cityName, keyword))
  if (comparableMatches.length === 1) {
    return comparableMatches[0] ?? null
  }

  return undefined
}

const resetSearchConfirmState = () => {
  searchConfirmVisible.value = false
  pendingSearchCityName.value = ''
  pendingSearchCityDisplayName.value = ''
  pendingSearchFromCandidate.value = false
}

const openSearchConfirmDialog = (cityName: string, options?: { displayName?: string; fromCandidate?: boolean }) => {
  pendingSearchCityName.value = cityName
  pendingSearchCityDisplayName.value = options?.displayName ?? cityName
  pendingSearchFromCandidate.value = options?.fromCandidate ?? false
  searchConfirmVisible.value = true
}

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
  if (route.name === 'center' || route.name === 'list' || route.name === 'login-list') {
    await router.push('/login')
  }
}

const goToList = () => {
  router.push('/list')
}

const goToLoginList = () => {
  router.push('/login-list')
}

const goToCenter = () => {
  router.push('/center')
}

const handleSearchSubmit = async (keyword: string) => {
  if (route.name !== 'weather') {
    await cityStore.ensureCitiesLoaded()
    const defaultCity = cityStore.cities[0]

    if (!defaultCity) {
      ElMessage.warning('当前账户还没有默认城市，请先在我的城市中设置')
      return
    }

    await router.push(`/weather/${encodeURIComponent(defaultCity.cityName)}`)
    return
  }

  const normalizedKeyword = normalizeRawCityName(keyword)
  if (!normalizedKeyword) {
    ElMessage.warning('请输入要搜索的城市名称')
    return
  }

  await cityStore.ensureCitiesLoaded()
  const existingCity = findMatchedCity(cityStore.cities, normalizedKeyword)
  if (existingCity) {
    await router.push(`/weather/${encodeURIComponent(existingCity.cityName)}`)
    return
  }

  try {
    const response = await getCityList(normalizedKeyword)
    const candidate = resolveSearchCandidate(response.data, normalizedKeyword)

    if (candidate === undefined) {
      ElMessage.warning('请输入更完整的城市名称')
      return
    }

    if (candidate) {
      openSearchConfirmDialog(candidate.cityName, {
        displayName: candidate.cityName,
        fromCandidate: true,
      })
      return
    }

    openSearchConfirmDialog(normalizedKeyword)
  } catch (error) {
    const message = error instanceof Error ? error.message : '城市搜索失败，请稍后重试'
    ElMessage.warning(message)
  }
}

const confirmAddSearchedCity = async () => {
  const targetCityName = pendingSearchCityName.value
  if (!targetCityName) {
    resetSearchConfirmState()
    return
  }

  const success = await cityStore.createCityByName(targetCityName)
  if (!success) {
    return
  }

  resetSearchConfirmState()
  await router.push(`/weather/${encodeURIComponent(targetCityName)}`)
}
</script>

<template>
  <div class="app-layout">
    <AppTopNav
      :brand-text="brandText"
      :show-center-search="showCenterSearch"
      :show-my-cities="showMyCities"
      :show-profile-center="showProfileCenter"
      :show-login-list="showLoginList"
      :center-nav-centered="centerNavCentered"
      :active-center-action="activeCenterAction"
      :login-label="loginLabel"
      :avatar-url="navAvatarUrl"
      :show-logout="isLoggedIn"
      @login-click="goToLogin"
      @my-cities-click="goToList"
      @profile-center-click="goToCenter"
      @login-list-click="goToLoginList"
      @logout-click="handleLogout"
      @search-submit="handleSearchSubmit"
    />
    <el-dialog
      v-model="searchConfirmVisible"
      append-to-body
      align-center
      class="search-city-dialog"
      modal-class="search-city-dialog__overlay"
      :show-close="false"
    >
      <template #header>
        <div class="search-city-dialog__header">
          <p class="search-city-dialog__kicker">CITY SEARCH UPLINK</p>
          <h3 class="search-city-dialog__title">是否加入城市列表</h3>
        </div>
      </template>

      <div class="search-city-dialog__body">
        <p class="search-city-dialog__text">
          <span v-if="pendingSearchFromCandidate">已搜索到城市</span>
          <span v-else>当前城市列表中未找到</span>
          <strong class="search-city-dialog__name">{{ pendingSearchCityDisplayName }}</strong>
        </p>
        <p class="search-city-dialog__hint">
          {{ pendingSearchFromCandidate ? '是否将该城市接入当前城市列表，并直接跳转到天气页？' : '是否将该名称加入当前城市列表，并直接跳转到天气页？' }}
        </p>
      </div>

      <template #footer>
        <div class="search-city-dialog__footer">
          <button class="search-city-dialog__btn search-city-dialog__btn--ghost" type="button" @click="resetSearchConfirmState">
            取消
          </button>
          <button class="search-city-dialog__btn search-city-dialog__btn--primary" type="button" @click="confirmAddSearchedCity">
            确认添加
          </button>
        </div>
      </template>
    </el-dialog>
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

:global(.search-city-dialog__overlay) {
  background:
    radial-gradient(circle at 18% 18%, rgba(117, 241, 255, 0.1), transparent 34%),
    radial-gradient(circle at 82% 78%, rgba(255, 82, 205, 0.1), transparent 36%),
    rgba(2, 8, 20, 0.42) !important;
}

:global(.search-city-dialog) {
  --el-dialog-bg-color: rgba(3, 10, 24, 0.96);
  --el-dialog-padding-primary: 0;
  width: min(440px, calc(100vw - 32px)) !important;
  border: 1px solid rgba(117, 241, 255, 0.34);
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    inset 0 0 22px rgba(117, 241, 255, 0.08),
    0 0 32px rgba(0, 145, 255, 0.24),
    0 0 38px rgba(255, 82, 205, 0.12);
}

:global(.search-city-dialog .el-dialog__header) {
  margin: 0;
  padding: 0;
}

:global(.search-city-dialog .el-dialog__body) {
  padding: 0;
}

:global(.search-city-dialog .el-dialog__footer) {
  padding: 0;
}

.search-city-dialog__header {
  padding: 18px 20px 14px;
  background:
    linear-gradient(90deg, rgba(117, 241, 255, 0.12), transparent 45%),
    linear-gradient(180deg, rgba(6, 22, 50, 0.96), rgba(4, 12, 28, 0.92));
  border-bottom: 1px solid rgba(117, 241, 255, 0.16);
}

.search-city-dialog__kicker {
  margin: 0 0 8px;
  color: rgba(117, 241, 255, 0.62);
  font-size: 11px;
  letter-spacing: 0.2em;
}

.search-city-dialog__title {
  margin: 0;
  color: var(--cyber-cyan);
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.42);
}

.search-city-dialog__body {
  padding: 20px;
  background:
    radial-gradient(circle at top, rgba(117, 241, 255, 0.08), transparent 35%),
    linear-gradient(180deg, rgba(4, 12, 28, 0.98), rgba(1, 6, 18, 0.98));
}

.search-city-dialog__text {
  margin: 0;
  color: rgba(214, 242, 255, 0.82);
  line-height: 1.7;
}

.search-city-dialog__name {
  display: block;
  margin-top: 10px;
  color: var(--cyber-cyan);
  font-size: 24px;
  letter-spacing: 0.08em;
  text-shadow:
    0 0 12px rgba(117, 241, 255, 0.48),
    0 0 18px rgba(255, 82, 205, 0.18);
}

.search-city-dialog__hint {
  margin: 14px 0 0;
  color: rgba(183, 216, 255, 0.7);
  line-height: 1.7;
}

.search-city-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 20px 20px;
  background:
    radial-gradient(circle at bottom, rgba(117, 241, 255, 0.04), transparent 42%),
    linear-gradient(180deg, rgba(4, 12, 28, 0.98), rgba(1, 6, 18, 0.98));
}

.search-city-dialog__btn {
  min-width: 104px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(117, 241, 255, 0.34);
  background: rgba(4, 18, 42, 0.72);
  color: var(--cyber-text);
  cursor: pointer;
  letter-spacing: 0.08em;
  transition:
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    transform var(--cyber-ease),
    filter var(--cyber-ease);
}

.search-city-dialog__btn:hover {
  transform: translateY(-1px);
}

.search-city-dialog__btn--ghost:hover {
  border-color: rgba(117, 241, 255, 0.56);
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.12),
    0 0 14px rgba(117, 241, 255, 0.14);
}

.search-city-dialog__btn--primary {
  border-color: rgba(255, 82, 205, 0.46);
  background:
    linear-gradient(135deg, rgba(255, 82, 205, 0.18), rgba(0, 145, 255, 0.16)),
    rgba(4, 18, 42, 0.82);
  color: #f4fbff;
}

.search-city-dialog__btn--primary:hover {
  border-color: rgba(255, 82, 205, 0.72);
  box-shadow:
    inset 0 0 16px rgba(255, 82, 205, 0.14),
    0 0 16px rgba(255, 82, 205, 0.18);
}

@media (max-width: 640px) {
  .app-main {
    min-height: calc(100vh - var(--app-nav-height-mobile));
    padding-top: var(--app-nav-height-mobile);
  }

  .search-city-dialog__footer {
    flex-direction: column-reverse;
  }

  .search-city-dialog__btn {
    width: 100%;
  }
}
</style>
