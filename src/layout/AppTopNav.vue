<template>
  <!-- 顶部导航栏 -->
  <header class="top-nav">
    <div class="nav-inner">
      <!-- 导航栏左侧 -->
      <div class="nav-left">
        <el-icon class="logo-icon"><Cloudy /></el-icon>
        <span class="logo-text">{{ props.brandText }}</span>
      </div>
      <div v-if="props.showCenterSearch" class="nav-center">
        <div class="search-wrap">
          <input
            v-model="searchKeyword"
            class="search"
            type="text"
            :placeholder="props.searchPlaceholder"
            @keydown.enter="emitSearchSubmit"
          />
          <button type="button" class="search-trigger" aria-label="查询默认城市" @click="emitSearchSubmit">
            <el-icon class="search-icon"><Search /></el-icon>
          </button>
        </div>
      </div>
      <div v-else-if="props.showMyCities || props.showProfileCenter || props.showLoginList" class="nav-center nav-center-button">
        <button
          v-if="props.showMyCities"
          ref="myCitiesBtnRef"
          type="button"
          class="my-cities-btn"
          :class="[
            `is-${myCitiesParticleState}`,
            { 'is-current': props.activeCenterAction === 'my-cities' },
          ]"
          @click="emit('my-cities-click')"
          @mouseenter="onMyCitiesMouseEnter"
          @mouseleave="onMyCitiesMouseLeave"
          @mousedown="onMyCitiesMouseDown"
          @mouseup="onMyCitiesMouseUp"
          @focus="onMyCitiesFocus"
          @blur="onMyCitiesBlur"
        >
          <span :id="myCitiesParticleHostId" class="my-cities-particles" aria-hidden="true" />
          <span class="my-cities-label">我的城市</span>
        </button>
        <button
          v-if="props.showProfileCenter"
          ref="profileCenterBtnRef"
          type="button"
          class="my-cities-btn profile-center-btn"
          :class="[
            `is-${profileCenterParticleState}`,
            { 'is-current': props.activeCenterAction === 'profile-center' },
          ]"
          @click="emit('profile-center-click')"
          @mouseenter="onProfileCenterMouseEnter"
          @mouseleave="onProfileCenterMouseLeave"
          @mousedown="onProfileCenterMouseDown"
          @mouseup="onProfileCenterMouseUp"
          @focus="onProfileCenterFocus"
          @blur="onProfileCenterBlur"
        >
          <span :id="profileCenterParticleHostId" class="my-cities-particles" aria-hidden="true" />
          <span class="my-cities-label">个人中心</span>
        </button>
        <button
          v-if="props.showLoginList"
          ref="loginListBtnRef"
          type="button"
          class="my-cities-btn login-list-btn"
          :class="[
            `is-${loginListParticleState}`,
            { 'is-current': props.activeCenterAction === 'login-list' },
          ]"
          @click="emit('login-list-click')"
          @mouseenter="onLoginListMouseEnter"
          @mouseleave="onLoginListMouseLeave"
          @mousedown="onLoginListMouseDown"
          @mouseup="onLoginListMouseUp"
          @focus="onLoginListFocus"
          @blur="onLoginListBlur"
        >
          <span :id="loginListParticleHostId" class="my-cities-particles" aria-hidden="true" />
          <span class="my-cities-label">登录列表</span>
        </button>
      </div>
      <!-- 导航栏右侧 -->
      <div class="nav-right">
        <el-tooltip content="将前往Github仓库" placement="bottom" effect="dark">
          <a
            class="github-link"
            :href="props.githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="查看 GitHub 仓库"
          >
            <img class="github-icon" :src="githubFavicon" alt="GitHub" />
          </a>
        </el-tooltip>
        <button
          type="button"
          class="login-status"
          aria-label="前往登录页面"
          @click="emit('login-click')"
        >
          <span v-if="showAvatar" class="status-avatar-shell" aria-hidden="true">
            <img
              class="status-avatar"
              :src="props.avatarUrl"
              alt=""
              loading="lazy"
              @error="handleAvatarError"
            />
          </span>
          <span v-else class="status-dot" />
          <span>{{ props.loginLabel }}</span>
        </button>
        <button
          v-if="props.showLogout"
          type="button"
          class="logout-btn"
          aria-label="退出登录"
          @click="emit('logout-click')"
        >
          退出
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Cloudy, Search } from '@element-plus/icons-vue'
import type { Container, ISourceOptions } from '@tsparticles/engine'
import { tsParticles } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import githubFavicon from '@/assets/icons/github-favicon.png'

const props = withDefaults(
  defineProps<{
    githubUrl?: string
    brandText?: string
    showCenterSearch?: boolean
    showMyCities?: boolean
    showProfileCenter?: boolean
    showLoginList?: boolean
    searchPlaceholder?: string
    loginLabel?: string
    avatarUrl?: string
    showLogout?: boolean
    activeCenterAction?: string
  }>(),
  {
    githubUrl: 'https://github.com/wxh-cyber/weather-frontend',
    brandText: '小慕天气 · 控制台',
    showCenterSearch: true,
    showMyCities: false,
    showProfileCenter: false,
    showLoginList: false,
    searchPlaceholder: '搜索城市',
    loginLabel: '未登录',
    avatarUrl: '',
    showLogout: false,
    activeCenterAction: '',
  },
)

const emit = defineEmits<{
  (e: 'login-click'): void
  (e: 'my-cities-click'): void
  (e: 'profile-center-click'): void
  (e: 'login-list-click'): void
  (e: 'logout-click'): void
  (e: 'search-submit', keyword: string): void
}>()

type MyCitiesParticleState = 'idle' | 'hover' | 'active'

const searchKeyword = ref('')
const myCitiesParticleHostId = 'my-cities-particles'
const myCitiesParticleState = ref<MyCitiesParticleState>('idle')
const myCitiesHovered = ref(false)
const myCitiesFocused = ref(false)
const myCitiesBtnRef = ref<HTMLButtonElement | null>(null)
const profileCenterParticleHostId = 'profile-center-particles'
const profileCenterParticleState = ref<MyCitiesParticleState>('idle')
const profileCenterHovered = ref(false)
const profileCenterFocused = ref(false)
const profileCenterBtnRef = ref<HTMLButtonElement | null>(null)
const loginListParticleHostId = 'login-list-particles'
const loginListParticleState = ref<MyCitiesParticleState>('idle')
const loginListHovered = ref(false)
const loginListFocused = ref(false)
const loginListBtnRef = ref<HTMLButtonElement | null>(null)
const avatarLoadFailed = ref(false)
let myCitiesContainer: Container | undefined
let profileCenterContainer: Container | undefined
let loginListContainer: Container | undefined
let slimLoader: Promise<void> | null = null

const showAvatar = computed(() => Boolean(props.avatarUrl && !avatarLoadFailed.value))

const emitSearchSubmit = () => {
  emit('search-submit', searchKeyword.value.trim())
}

const isReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const ensureSlimReady = async () => {
  if (!slimLoader) {
    slimLoader = loadSlim(tsParticles)
  }
  await slimLoader
}

const getParticleOptions = (state: MyCitiesParticleState, emitterWidth: number): ISourceOptions => {
  const emitterRate =
    state === 'active'
      ? { delay: 0.024, quantity: 14 }
      : state === 'hover'
        ? { delay: 0.075, quantity: 8 }
        : { delay: 1.8, quantity: 1 }

  const moveSpeed = state === 'active' ? 3.2 : state === 'hover' ? 2.1 : 0.7
  const minOpacity = state === 'idle' ? 0.08 : 0.56
  const maxOpacity = state === 'active' ? 1 : 0.94

  return {
    fullScreen: { enable: false },
    detectRetina: true,
    fpsLimit: 60,
    background: { color: 'transparent' },
    particles: {
      number: { value: 0 },
      color: {
        value: ['#75f1ff', '#ff52cd', '#7ecbff'],
      },
      shape: { type: 'circle' },
      opacity: {
        value: { min: minOpacity, max: maxOpacity },
        animation: {
          enable: true,
          speed: 1,
          startValue: 'max',
          destroy: 'min',
          sync: false,
        },
      },
      size: {
        value: { min: 1.4, max: state === 'active' ? 4.8 : 3.8 },
      },
      move: {
        enable: true,
        direction: 'top',
        speed: { min: moveSpeed * 0.82, max: moveSpeed * 1.58 },
        outModes: {
          default: 'destroy',
        },
        angle: {
          value: state === 'active' ? 44 : 26,
          offset: 0,
        },
        gravity: {
          enable: false,
        },
      },
      life: {
        count: 1,
        duration: { value: { min: 0.3, max: state === 'active' ? 0.72 : 0.62 } },
      },
    },
    emitters: {
      direction: 'top',
      position: { x: 50, y: 100 },
      rate: emitterRate,
      size: { width: emitterWidth, height: 0 },
      particles: {
        move: {
          angle: {
            offset: 0,
            value: state === 'active' ? 48 : 28,
          },
        },
      },
    },
    pauseOnOutsideViewport: true,
  }
}

const destroyButtonParticles = (containerRef: 'myCities' | 'profileCenter' | 'loginList') => {
  if (containerRef === 'myCities') {
    myCitiesContainer?.destroy()
    myCitiesContainer = undefined
    return
  }
  if (containerRef === 'profileCenter') {
    profileCenterContainer?.destroy()
    profileCenterContainer = undefined
    return
  }
  loginListContainer?.destroy()
  loginListContainer = undefined
}

const mountButtonParticles = async (
  hostId: string,
  state: MyCitiesParticleState,
  buttonRef: HTMLButtonElement | null,
  visible: boolean,
  containerRef: 'myCities' | 'profileCenter' | 'loginList',
) => {
  if (!visible || isReducedMotion()) {
    destroyButtonParticles(containerRef)
    return
  }

  await nextTick()
  const host = document.getElementById(hostId)
  if (!host) {
    return
  }

  await ensureSlimReady()
  destroyButtonParticles(containerRef)
  const emitterWidth = Math.max(44, Math.round((buttonRef?.clientWidth || 72) * 0.85))
  const container = await tsParticles.load({
    id: hostId,
    options: getParticleOptions(state, emitterWidth),
  })

  if (containerRef === 'myCities') {
    myCitiesContainer = container
    return
  }
  if (containerRef === 'profileCenter') {
    profileCenterContainer = container
    return
  }

  loginListContainer = container
}

const mountMyCitiesParticles = async () => {
  await mountButtonParticles(
    myCitiesParticleHostId,
    myCitiesParticleState.value,
    myCitiesBtnRef.value,
    props.showMyCities,
    'myCities',
  )
}

const mountLoginListParticles = async () => {
  await mountButtonParticles(
    loginListParticleHostId,
    loginListParticleState.value,
    loginListBtnRef.value,
    props.showLoginList,
    'loginList',
  )
}

const mountProfileCenterParticles = async () => {
  await mountButtonParticles(
    profileCenterParticleHostId,
    profileCenterParticleState.value,
    profileCenterBtnRef.value,
    props.showProfileCenter,
    'profileCenter',
  )
}

const updateMyCitiesParticleState = (nextState: MyCitiesParticleState) => {
  if (myCitiesParticleState.value === nextState) {
    return
  }
  myCitiesParticleState.value = nextState
  void mountMyCitiesParticles()
}

const updateLoginListParticleState = (nextState: MyCitiesParticleState) => {
  if (loginListParticleState.value === nextState) {
    return
  }
  loginListParticleState.value = nextState
  void mountLoginListParticles()
}

const updateProfileCenterParticleState = (nextState: MyCitiesParticleState) => {
  if (profileCenterParticleState.value === nextState) {
    return
  }
  profileCenterParticleState.value = nextState
  void mountProfileCenterParticles()
}

const onMyCitiesMouseEnter = () => {
  myCitiesHovered.value = true
  updateMyCitiesParticleState('hover')
}

const onMyCitiesMouseLeave = () => {
  myCitiesHovered.value = false
  if (myCitiesFocused.value) {
    updateMyCitiesParticleState('hover')
    return
  }
  updateMyCitiesParticleState('idle')
}

const onMyCitiesMouseDown = () => {
  updateMyCitiesParticleState('active')
}

const onMyCitiesMouseUp = () => {
  updateMyCitiesParticleState(myCitiesHovered.value || myCitiesFocused.value ? 'hover' : 'idle')
}

const onMyCitiesFocus = () => {
  myCitiesFocused.value = true
  updateMyCitiesParticleState('hover')
}

const onMyCitiesBlur = () => {
  myCitiesFocused.value = false
  updateMyCitiesParticleState(myCitiesHovered.value ? 'hover' : 'idle')
}

const onLoginListMouseEnter = () => {
  loginListHovered.value = true
  updateLoginListParticleState('hover')
}

const onLoginListMouseLeave = () => {
  loginListHovered.value = false
  if (loginListFocused.value) {
    updateLoginListParticleState('hover')
    return
  }
  updateLoginListParticleState('idle')
}

const onLoginListMouseDown = () => {
  updateLoginListParticleState('active')
}

const onLoginListMouseUp = () => {
  updateLoginListParticleState(loginListHovered.value || loginListFocused.value ? 'hover' : 'idle')
}

const onLoginListFocus = () => {
  loginListFocused.value = true
  updateLoginListParticleState('hover')
}

const onLoginListBlur = () => {
  loginListFocused.value = false
  updateLoginListParticleState(loginListHovered.value ? 'hover' : 'idle')
}

const onProfileCenterMouseEnter = () => {
  profileCenterHovered.value = true
  updateProfileCenterParticleState('hover')
}

const onProfileCenterMouseLeave = () => {
  profileCenterHovered.value = false
  if (profileCenterFocused.value) {
    updateProfileCenterParticleState('hover')
    return
  }
  updateProfileCenterParticleState('idle')
}

const onProfileCenterMouseDown = () => {
  updateProfileCenterParticleState('active')
}

const onProfileCenterMouseUp = () => {
  updateProfileCenterParticleState(profileCenterHovered.value || profileCenterFocused.value ? 'hover' : 'idle')
}

const onProfileCenterFocus = () => {
  profileCenterFocused.value = true
  updateProfileCenterParticleState('hover')
}

const onProfileCenterBlur = () => {
  profileCenterFocused.value = false
  updateProfileCenterParticleState(profileCenterHovered.value ? 'hover' : 'idle')
}

const handleAvatarError = (event: Event) => {
  avatarLoadFailed.value = true
}

watch(
  () => props.avatarUrl,
  () => {
    avatarLoadFailed.value = false
  },
  { immediate: true },
)

watch(
  () => props.showMyCities,
  (show) => {
    if (!show) {
      myCitiesParticleState.value = 'idle'
      destroyButtonParticles('myCities')
      return
    }
    void mountMyCitiesParticles()
  },
  { immediate: true },
)

watch(
  () => props.showProfileCenter,
  (show) => {
    if (!show) {
      profileCenterParticleState.value = 'idle'
      destroyButtonParticles('profileCenter')
      return
    }
    void mountProfileCenterParticles()
  },
  { immediate: true },
)

watch(
  () => props.showLoginList,
  (show) => {
    if (!show) {
      loginListParticleState.value = 'idle'
      destroyButtonParticles('loginList')
      return
    }
    void mountLoginListParticles()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  destroyButtonParticles('myCities')
  destroyButtonParticles('profileCenter')
  destroyButtonParticles('loginList')
})
</script>

<style scoped>
/* 顶部导航栏样式 */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  width: 100%;
  height: var(--app-nav-height);
  background: linear-gradient(90deg, rgba(2, 18, 45, 0.72), rgba(7, 25, 58, 0.55));
  backdrop-filter: blur(10px);           /* 实现导航栏背景的毛玻璃效果 */
  border-bottom: 1px solid rgba(94, 246, 255, 0.55);
  box-shadow:
    inset 0 -1px 0 rgba(94, 246, 255, 0.3),
    0 0 24px rgba(0, 195, 255, 0.25);
  overflow: hidden;
}

/* 顶部导航栏内部基本布局 */
.nav-inner {
  width: min(1100px, calc(100% - 24px));       /* 最大不超过1100px，小屏时左右共留24px间隙 */
  height: 100%;
  margin: 0 auto;                     /* 水平居中容器 */
  display: grid;
  grid-template-columns: auto minmax(220px, 1fr) auto;
  align-items: center;
  gap: 14px;
}

/* 导航栏左侧样式 */
.nav-left {
  display: inline-flex;           /* 内容按行内块显示，但内部用flex排列 */
  align-items: center;
  gap: 8px;                       /* 图标和文字间距为8px */
  color: #e6fdff;
  cursor: pointer;
  min-width: 0;
}

/* 左侧图标样式 */
.logo-icon {
  font-size: 20px;
  color: #75f1ff;
  filter: drop-shadow(0 0 8px rgba(117, 241, 255, 0.8));             /* 给图标轮廓加外发光 */
  transition: transform 0.25s ease, opacity 0.25s ease, filter 0.25s ease;
}

/* 左侧文本样式 */
.logo-text {
  font-size: 17px;
  letter-spacing: 0.08em;
  white-space: nowrap;
  text-shadow:
    0 0 8px rgba(117, 241, 255, 0.75),
    0 0 18px rgba(0, 133, 255, 0.45);
  transition: transform 0.25s ease, filter 0.25s ease, text-shadow 0.25s ease;
}

/* hover伪元素实现动态交互效果 */
.logo-icon:hover,
.nav-left:hover .logo-icon {
  opacity: 1;
  transform: translateY(-3px) scale(1.14);          /* 上移3px并放大1.14倍 */
  filter: drop-shadow(0 0 14px rgba(117, 241, 255, 1));
}

.logo-icon:hover + .logo-text,
.nav-left:hover .logo-text {
  transform: translateY(-2px) scale(1.03);
  filter: brightness(1.18);
  text-shadow:
    0 0 14px rgba(117, 241, 255, 1),
    0 0 30px rgba(0, 133, 255, 0.72);
}

/* 导航栏右侧样式 */
.nav-right {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  justify-self: end;
}

.nav-center {
  width: 100%;
}

.nav-center-button {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 12px;
  height: 100%;
}

.my-cities-btn {
  position: relative;
  height: calc(100% - 2px);
  min-height: 0;
  width: fit-content;
  min-width: 90px;
  padding: 0 18px;
  border-radius: 2px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  white-space: nowrap;
  color: var(--cyber-cyan);
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.08), transparent 24%),
    linear-gradient(165deg, rgba(6, 25, 58, 0.88), rgba(3, 15, 39, 0.74)),
    rgba(3, 20, 45, 0.5);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1;
  letter-spacing: 0.08em;
  font-size: 13px;
  box-shadow:
    inset 0 1px 0 rgba(180, 252, 255, 0.16),
    inset 0 0 18px rgba(117, 241, 255, 0.1),
    0 1px 10px rgba(0, 0, 0, 0.28);
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color var(--cyber-ease),
    transform var(--cyber-ease),
    box-shadow var(--cyber-ease),
    filter var(--cyber-ease),
    background var(--cyber-ease),
    color var(--cyber-ease);
}

.my-cities-btn::before,
.my-cities-btn::after {
  content: '';
  position: absolute;
  pointer-events: none;
  transition: opacity var(--cyber-ease), transform var(--cyber-ease), box-shadow var(--cyber-ease);
}

.my-cities-btn::before {
  inset: 4px 6px;
  border: 1px solid rgba(117, 241, 255, 0.12);
  border-radius: 1px;
  opacity: 0.68;
}

.my-cities-btn::after {
  left: 14px;
  right: 14px;
  bottom: 4px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(117, 241, 255, 0.9), transparent);
  box-shadow: 0 0 10px rgba(117, 241, 255, 0.38);
  opacity: 0.42;
}

.my-cities-label {
  position: relative;
  z-index: 2;
  white-space: nowrap;
  text-shadow:
    0 0 6px rgba(117, 241, 255, 0.34),
    0 0 14px rgba(117, 241, 255, 0.18);
  transition: text-shadow var(--cyber-ease), transform var(--cyber-ease), color var(--cyber-ease);
}

.my-cities-particles {
  position: absolute;
  inset: 10% 2px 0 2px;
  z-index: 1;
  pointer-events: none;
  opacity: 0.12;
  mix-blend-mode: screen;
  filter: drop-shadow(0 0 5px rgba(117, 241, 255, 0.48)) drop-shadow(0 0 8px rgba(255, 82, 205, 0.28));
  transition: opacity 0.14s ease;
}

.my-cities-btn:hover,
.my-cities-btn:focus-visible {
  border-color: rgba(117, 241, 255, 0.76);
  background:
    linear-gradient(180deg, rgba(117, 241, 255, 0.14), transparent 28%),
    linear-gradient(165deg, rgba(8, 31, 72, 0.92), rgba(5, 18, 47, 0.8)),
    rgba(3, 20, 45, 0.56);
  box-shadow:
    inset 0 1px 0 rgba(190, 253, 255, 0.28),
    inset 0 0 20px rgba(117, 241, 255, 0.22),
    0 0 16px rgba(117, 241, 255, 0.2),
    0 0 24px rgba(255, 82, 205, 0.14);
  transform: translateY(-1px) scale(1.01);
  filter: brightness(1.06);
  outline: none;
}

.my-cities-btn:hover::before,
.my-cities-btn:focus-visible::before {
  opacity: 1;
  transform: scaleX(1.01);
  box-shadow: inset 0 0 12px rgba(117, 241, 255, 0.08);
}

.my-cities-btn:hover::after,
.my-cities-btn:focus-visible::after {
  opacity: 0.86;
  transform: scaleX(1.04);
}

.my-cities-btn:hover .my-cities-label,
.my-cities-btn:focus-visible .my-cities-label {
  text-shadow:
    0 0 8px rgba(117, 241, 255, 0.52),
    0 0 18px rgba(117, 241, 255, 0.28);
}

.my-cities-btn.is-current {
  border-color: rgba(255, 82, 205, 0.86);
  background:
    linear-gradient(180deg, rgba(255, 82, 205, 0.12), transparent 30%),
    linear-gradient(165deg, rgba(11, 28, 69, 0.94), rgba(8, 17, 49, 0.82)),
    rgba(4, 18, 45, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(235, 199, 255, 0.16),
    inset 0 0 22px rgba(117, 241, 255, 0.2),
    0 0 18px rgba(117, 241, 255, 0.16),
    0 0 28px rgba(255, 82, 205, 0.22);
  color: #f7fdff;
}

.my-cities-btn.is-current::before {
  border-color: rgba(255, 82, 205, 0.24);
  opacity: 0.96;
}

.my-cities-btn.is-current::after {
  background: linear-gradient(90deg, transparent, rgba(255, 167, 231, 0.96), transparent);
  box-shadow:
    0 0 12px rgba(255, 82, 205, 0.42),
    0 0 20px rgba(117, 241, 255, 0.22);
  opacity: 0.92;
}

.my-cities-btn.is-current .my-cities-label {
  text-shadow:
    0 0 10px rgba(211, 249, 255, 0.52),
    0 0 20px rgba(255, 82, 205, 0.22);
}

.my-cities-btn.is-hover .my-cities-particles,
.my-cities-btn:focus-visible .my-cities-particles {
  opacity: 1;
}

.my-cities-btn.is-active .my-cities-particles {
  opacity: 1;
}

.my-cities-btn:active {
  border-color: rgba(255, 82, 205, 0.9);
  transform: translateY(1px) scale(0.995);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.32),
    0 0 10px rgba(255, 82, 205, 0.32);
}

.my-cities-btn:active::after {
  opacity: 1;
}

.search-wrap {
  width: 100%;
  position: relative;
}

.search {
  width: 100%;
  border: 1px solid rgba(117, 241, 255, 0.28);
  border-radius: 999px;
  padding: 10px 42px 10px 14px;
  background: rgba(5, 18, 54, 0.78);
  color: var(--cyber-text);
  outline: none;
  transition: border-color var(--cyber-ease), box-shadow var(--cyber-ease), background var(--cyber-ease);
}

.search::placeholder {
  color: var(--cyber-text-muted);
}

.search:focus {
  border-color: rgba(117, 241, 255, 0.58);
  box-shadow: 0 0 0 3px rgba(117, 241, 255, 0.12);
  background: rgba(7, 24, 56, 0.86);
}

.search-icon {
  font-size: 18px;
}

.search-trigger {
  position: absolute;
  right: 10px;
  top: 50%;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  color: var(--cyber-cyan);
  cursor: pointer;
  filter: drop-shadow(0 0 8px rgba(117, 241, 255, 0.7));
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
  transition: transform var(--cyber-ease), filter var(--cyber-ease), color var(--cyber-ease);
}

.search-trigger:hover,
.search-trigger:focus-visible {
  color: #eafcff;
  transform: translateY(-50%) scale(1.05);
  filter: drop-shadow(0 0 10px rgba(117, 241, 255, 0.88));
  outline: none;
}

/* 右侧github链接样式 */
.github-link {
  width: 34px;
  height: 34px;
  border-radius: 50%;                 /* 图标为圆形 */
  border: 1px solid rgba(117, 241, 255, 0.65);
  color: #f8ecff;
  background: rgba(52, 106, 176, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(117, 241, 255, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

/* github图标样式 */
.github-icon {
  width: 18px;
  height: 18px;
  display: block;
  filter: brightness(1.12) contrast(1.08);      /* 设置图标亮度和对比度 */
}

/* github链接悬停样式 */
.github-link:hover,
.github-link:focus {
  transform: translateY(-1px);
  background: rgba(74, 129, 200, 0.95);
  border-color: rgba(255, 82, 205, 0.8);
  box-shadow: 0 0 12px rgba(255, 82, 205, 0.45);
}

/* 登录状态样式 */
.login-status {
  min-width: 88px;
  height: 34px;
  padding: 0 10px;
  cursor: pointer;
  appearance: none;
  border-radius: 999px;
  border: 1px solid rgba(117, 241, 255, 0.45);
  color: #ddf8ff;
  background: rgba(3, 20, 45, 0.45);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  box-shadow: inset 0 0 12px rgba(117, 241, 255, 0.15);
  transition: border-color var(--cyber-ease), box-shadow var(--cyber-ease), transform var(--cyber-ease);
}

.login-status:hover,
.login-status:focus-visible {
  border-color: rgba(117, 241, 255, 0.72);
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.24),
    0 0 12px rgba(117, 241, 255, 0.26);
  transform: translateY(-1px);
  outline: none;
}

.status-avatar-shell {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 1px;
  background:
    linear-gradient(135deg, rgba(117, 241, 255, 0.9), rgba(255, 82, 205, 0.78)),
    rgba(3, 20, 45, 0.82);
  box-shadow:
    0 0 10px rgba(117, 241, 255, 0.38),
    inset 0 0 8px rgba(117, 241, 255, 0.18);
}

.status-avatar {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(2, 10, 24, 0.96);
  box-shadow: inset 0 0 8px rgba(117, 241, 255, 0.16);
}

.logout-btn {
  min-width: 46px;
  height: 34px;
  padding: 0 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--cyber-text-muted);
  cursor: pointer;
  letter-spacing: 0.08em;
  text-shadow: 0 0 6px rgba(117, 241, 255, 0.22);
  transition:
    color var(--cyber-ease),
    transform var(--cyber-ease),
    text-shadow var(--cyber-ease),
    filter var(--cyber-ease);
}

.logout-btn:hover,
.logout-btn:focus-visible {
  color: #aaf8ff;
  transform: translateY(-1px);
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.66),
    0 0 16px rgba(255, 82, 205, 0.28);
  filter: brightness(1.08);
  outline: none;
}

.logout-btn:active {
  transform: translateY(1px);
  text-shadow:
    0 0 8px rgba(117, 241, 255, 0.8),
    0 0 18px rgba(255, 82, 205, 0.36);
}

/* 登录状态小圆点样式 */
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;                  /* 圆点为圆形 */
  background: #75f1ff;
  box-shadow: 0 0 10px rgba(117, 241, 255, 0.95);
  animation: signal-pulse 2s ease-in-out infinite;        /* 添加脉冲动画 */
}

@media (max-width: 640px) {
  .top-nav {
    height: var(--app-nav-height-mobile);
  }

  .nav-inner {
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  .nav-center {
    grid-column: 1 / -1;
    order: 3;
  }

  .nav-center-button {
    grid-column: auto;
    order: 0;
    height: 100%;
    gap: 6px;
  }

  .logo-text {
    font-size: 15px;
    letter-spacing: 0.05em;
  }

  .nav-right {
    gap: 8px;
  }

  .login-status {
    min-width: 74px;
    font-size: 12px;
    padding: 0 8px;
  }

  .status-avatar-shell {
    width: 16px;
    height: 16px;
    flex-basis: 16px;
  }

  .logout-btn {
    min-width: 40px;
    font-size: 12px;
    padding: 0 6px;
  }

  .my-cities-btn {
    height: calc(100% - 2px);
    min-height: 0;
    min-width: 78px;
    padding: 0 12px;
    font-size: 12px;
  }
}

@keyframes signal-pulse {
  0%,
  100% {
    opacity: 0.75;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .search-icon {
    animation: none;
  }

  .my-cities-particles {
    display: none;
  }
}
</style>
