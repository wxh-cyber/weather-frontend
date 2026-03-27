<template>
  <div
    class="start-container"
    @mousemove="handlePointerMove"
    @mouseenter="showPointer"
    @mouseleave="hidePointer"
    @click="spawnRipple"
  >
    <!-- 给背景增加过渡效果 -->
    <Transition name="bg-fade" mode="out-in">
      <div :key="currentBackground" class="bg-layer" :style="{ backgroundImage: `url('${currentBackground}')` }" />
    </Transition>

    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-inner">
        <div class="nav-left">
          <el-icon class="logo-icon"><Cloudy /></el-icon>
          <span class="logo-text">小慕天气</span>
        </div>
        <div class="nav-right">
          <el-tooltip content="将前往Github仓库" placement="bottom" effect="dark">
            <a
              class="github-link"
              href="https://github.com/wxh-cyber/weather-frontend"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="查看 GitHub 仓库"
            >
              <img class="github-icon" :src="githubFavicon" alt="GitHub" />
            </a>
          </el-tooltip>
          <div class="login-status" role="status" aria-live="polite">
            <span class="status-dot" />
            <span>未登录</span>
          </div>
        </div>
      </div>
    </header>

    <div class="center-box">
      <p class="welcome-text">欢迎使用小慕天气！</p>
      <p class="time">{{ currentTime }}</p>
      <el-button class="start-btn">
        <el-icon class="btn-icon"><Cloudy /></el-icon>
        <span>开启天气查询</span>
      </el-button>
    </div>

    <div
      v-show="pointerVisible"
      class="cyber-cursor"
      :style="{ left: `${pointerX}px`, top: `${pointerY}px` }"
    />
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="click-ripple"
      :style="{ left: `${ripple.x}px`, top: `${ripple.y}px` }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Cloudy } from '@element-plus/icons-vue'
import sunnyBg1 from '@/assets/晴天(1).gif';
import sunnyBg2 from '@/assets/晴天(2).gif';
import rainyBg1 from '@/assets/雨天(1).gif';
import rainyBg2 from '@/assets/雨天(2).gif';
import snowyBg1 from '@/assets/雪天(1).gif';
import snowyBg2 from '@/assets/雪天(2).gif';
import githubFavicon from '@/assets/icons/github-favicon.png'

const currentTime = ref('');            //当前时间
const currentBgIndex = ref(0);          //当前背景索引
const backgrounds = [sunnyBg1, sunnyBg2, rainyBg1, rainyBg2, snowyBg1, snowyBg2];     //背景图片数组
const currentBackground = computed(() => backgrounds[currentBgIndex.value]);       //当前背景图片

//鼠标坐标位置相关信息
const pointerX = ref(0)
const pointerY = ref(0)
const pointerVisible = ref(false)
const ripples = ref<Array<{ id: number; x: number; y: number }>>([])
let rippleId = 0

//获取当前的时间，并格式化显示
const formatNow = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 定时器的引用
//该写法兼容了不同的浏览器
let timer: ReturnType<typeof setInterval> | null = null
let bgTimer: ReturnType<typeof setInterval> | null = null

//获取当前的光标坐标位置
const handlePointerMove = (event: MouseEvent) => {
  pointerX.value = event.clientX
  pointerY.value = event.clientY
}

const showPointer = () => {
  pointerVisible.value = true
}

const hidePointer = () => {
  pointerVisible.value = false
}

const spawnRipple = (event: MouseEvent) => {
  const id = rippleId++
  ripples.value.push({ id, x: event.clientX, y: event.clientY })
  setTimeout(() => {
    ripples.value = ripples.value.filter((item) => item.id !== id)
  }, 650)
}

//组件挂在后执行的函数
onMounted(() => {
  formatNow();
  //设置一个定时器，每秒更新一次时间
  timer = setInterval(formatNow, 1000);
  //设置一个定时器，每5秒切换一次背景
  bgTimer = setInterval(() => {
    currentBgIndex.value = (currentBgIndex.value + 1) % backgrounds.length
  }, 5000);
});

//在组件销毁前，清除显示时间定时器和背景切换定时器
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
  if (bgTimer) {
    clearInterval(bgTimer)
  }
})
</script>

<style scoped>
/* 设置数码管字体样式 */
@font-face {
  font-family: 'DSEG7Classic';
  src: url('../assets/fonts/DSEG7Classic-Regular.woff2') format('woff2');
  font-style: normal;
  font-weight: 400;
}

/* 最外层的相关样式 */
.start-container {
  position: relative;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  padding-top: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: none;
}

.start-container :deep(*) {
  cursor: none !important;
}

/* 给start-container增加装饰性背景层 */
.start-container::before {
  content: '';             /* 伪元素必须设定content */
  position: absolute;
  inset: 0;                /* 覆盖整个父元素，top/left/right/bottom：0的简写 */
  z-index: 0;
  background:              /* 三层渐变叠加效果 */
    /* 
        在左上偏内的位置打一个青色光斑 
            circle at 20% 15%：圆心在容器宽 20%、高 15%
            rgba(..., 0.2)：中心颜色较淡（20% 透明度）
            transparent 40%：到半径 40% 附近渐隐到透明
        视觉：左上角一团柔和青光。
    */
    radial-gradient(circle at 20% 15%, rgba(0, 255, 255, 0.2), transparent 40%),
    /*
        在右下区域再加一团粉色光斑。
            圆心在 85% 80%（靠右下）
            透明度 0.18，比第一层更轻
            到 45% 渐隐
        视觉：右下补一团粉紫色氛围光，形成对角线呼应。
     */
    radial-gradient(circle at 85% 80%, rgba(255, 0, 153, 0.18), transparent 45%),
    /*
        整体压一层从上到下变深的暗色遮罩。
            180deg：从上往下
            上方 0.35，下方 0.55（更深）
        视觉：统一背景明暗，增强文字可读性，让两团光不刺眼。
     */
    linear-gradient(180deg, rgba(6, 14, 32, 0.35), rgba(3, 7, 18, 0.55));
  pointer-events: none;        /* 不拦截鼠标点击事件，点击后穿透到真实内容 */
}

/* 绘制动态网格背景 */
.start-container::after {
  content: '';
  position: absolute;
  inset: 0;             
  z-index: 0;                /* 表明是背景装饰层 */
  background-image:
    /* 
        linear-gradient(color 1px, transparent 1px) 默认方向是 to bottom。
            含义：从每个重复块的顶部开始，先画 1px 的有色线，然后立刻变透明。
            配合 background-size: 48px 48px，这条“顶部 1px 线”每隔 48px 重复一次，形成一排排横线。
     */
    linear-gradient(rgba(117, 241, 255, 0.08) 1px, transparent 1px),
    /* 
        linear-gradient(90deg, color 1px, transparent 1px) 方向改成水平（to right）。
            含义：从每个重复块左侧开始，先画 1px 的有色线，然后透明。
            同样每 48px 重复，形成一列列竖线。
     */
    linear-gradient(90deg, rgba(117, 241, 255, 0.08) 1px, transparent 1px);
  background-size: 48px 48px;
  /* 上方可见度更低、下方更高，所以网格会出现“上淡下实”的渐隐效果 */
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.9));
  /* 
      grid-drift：对应 @keyframes 名称。
      16s：一轮动画 16 秒。
      linear：匀速移动，不加速不减速。
      infinite：无限循环。
   */
  animation: grid-drift 16s linear infinite;
  pointer-events: none;          /* 不会遮挡鼠标点击 */
}

.top-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3;
  width: 100%;
  height: 58px;
  background: linear-gradient(90deg, rgba(2, 18, 45, 0.72), rgba(7, 25, 58, 0.55));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(94, 246, 255, 0.55);
  box-shadow:
    inset 0 -1px 0 rgba(94, 246, 255, 0.3),
    0 0 24px rgba(0, 195, 255, 0.25);
}

.nav-inner {
  width: min(1100px, calc(100% - 24px));
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #e6fdff;
  cursor: pointer;
}

.logo-icon {
  font-size: 20px;
  color: #75f1ff;
  filter: drop-shadow(0 0 8px rgba(117, 241, 255, 0.8));
  transition: transform 0.25s ease, opacity 0.25s ease, filter 0.25s ease;
}

.logo-text {
  font-size: 17px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-shadow:
    0 0 8px rgba(117, 241, 255, 0.75),
    0 0 18px rgba(0, 133, 255, 0.45);
  transition: transform 0.25s ease, filter 0.25s ease, text-shadow 0.25s ease;
}

.logo-icon:hover,
.nav-left:hover .logo-icon {
  opacity: 1;
  transform: translateY(-3px) scale(1.14);
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

.nav-right {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.github-link {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(117, 241, 255, 0.65);
  color: #f8ecff;
  background: rgba(52, 106, 176, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(117, 241, 255, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.github-icon {
  width: 18px;
  height: 18px;
  display: block;
  filter: brightness(1.12) contrast(1.08);      /* 设置图标亮度和对比度 */
}

.github-link:hover,
.github-link:focus {
  transform: translateY(-1px);
  background: rgba(74, 129, 200, 0.95);
  border-color: rgba(255, 82, 205, 0.8);
  box-shadow: 0 0 12px rgba(255, 82, 205, 0.45);
}

.login-status {
  min-width: 88px;
  height: 34px;
  padding: 0 10px;
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
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #75f1ff;
  box-shadow: 0 0 10px rgba(117, 241, 255, 0.95);
  animation: signal-pulse 2s ease-in-out infinite;
}

.cyber-cursor {
  position: fixed;
  z-index: 12;
  width: 24px;
  height: 34px;
  transform: translate(-12%, -10%);
  pointer-events: none;
  animation: cursor-flicker 1.6s ease-in-out infinite;
}

.cyber-cursor::before,
.cyber-cursor::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.cyber-cursor::before {
  left: 0;
  top: 0;
  width: 24px;
  height: 34px;
  background: linear-gradient(160deg, rgba(138, 250, 255, 0.98), rgba(38, 201, 255, 0.92));
  clip-path: polygon(
    0 0,
    0 100%,
    30% 74%,
    45% 100%,
    58% 93%,
    45% 68%,
    82% 68%
  );
  filter: drop-shadow(0 0 10px rgba(117, 241, 255, 0.95));
}

.cyber-cursor::after {
  left: 3px;
  top: 3px;
  width: 18px;
  height: 28px;
  background: rgba(7, 28, 56, 0.5);
  clip-path: polygon(
    0 0,
    0 100%,
    31% 74%,
    46% 98%,
    56% 92%,
    43% 67%,
    82% 67%
  );
  box-shadow: inset 0 0 0 1px rgba(255, 65, 205, 0.45);
}

.click-ripple {
  position: fixed;
  z-index: 11;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(117, 241, 255, 0.95);
  box-shadow: 0 0 14px rgba(117, 241, 255, 0.75);
  transform: translate(-50%, -50%) scale(0.25);
  pointer-events: none;
  animation: ripple-expand 0.65s ease-out forwards;
}

@media (max-width: 640px) {
  .top-nav {
    height: 54px;
  }

  .start-container {
    padding-top: 64px;
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
}

/* 背景图片的相关样式 */
.bg-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 包裹时间和按钮的外层样式 */
.center-box {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 24px 26px;
  border-radius: 16px;
  border: 1px solid rgba(117, 241, 255, 0.28);
  background: rgba(4, 14, 34, 0.28);
  box-shadow:
    inset 0 0 20px rgba(117, 241, 255, 0.08),
    0 0 28px rgba(0, 145, 255, 0.2);
  backdrop-filter: blur(3px);
}

/* 首页欢迎标语的样式 */
.welcome-text {
  color: #9af5ff;
  font-size: 18px;
  letter-spacing: 0.14em;
  text-shadow:
    0 0 8px rgba(117, 241, 255, 0.9),
    0 0 16px rgba(0, 145, 255, 0.55);
  animation: glow-breathe 2.8s ease-in-out infinite;
}

/* 显示时间文本的样式 */
.time {
  font-size: 28px;
  color: #75f1ff;
  font-family: 'DSEG7Classic', 'Consolas', monospace;
  letter-spacing: 0.1em;
  word-spacing: 0.6em;
  font-variant-numeric: tabular-nums;
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.95),
    0 0 22px rgba(0, 145, 255, 0.6);
}

/* 查询按钮的样式 */
/* 为了去除Element自带的样式，因此增加其权重 */
.start-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px;
  padding: 10px 20px !important;
  backdrop-filter: blur(3px);      /* 增加背景的毛玻璃效果 */
  background: linear-gradient(135deg, rgba(0, 214, 255, 0.16), rgba(255, 0, 153, 0.08)) !important;
  border-color: rgba(117, 241, 255, 0.75) !important;
  color: #75f1ff !important;
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.4),
    0 0 14px rgba(0, 145, 255, 0.35) !important;
  transition:
    transform 0.2s ease,
    box-shadow 0.25s ease,
    filter 0.25s ease,
    background 0.25s ease;
}

.btn-icon {
  font-size: 18px;
  opacity: 0.9;
  color: #75f1ff;
  filter: drop-shadow(0 0 6px rgba(117, 241, 255, 0.7));
  transition: transform 0.25s ease, opacity 0.25s ease;
}

/* 悬停或点击查询按钮时展现的效果 */
.start-btn:hover,
.start-btn:focus {
  background: linear-gradient(135deg, rgba(0, 214, 255, 0.3), rgba(255, 0, 153, 0.24)) !important;
  border-color: rgba(255, 82, 205, 0.9) !important;
  color: #9af5ff !important;
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.5),
    0 0 18px rgba(255, 82, 205, 0.35) !important;
  filter: brightness(1.08);
}

/* 当悬停或点击按钮图标时，会往上移动并放大，展现动态效果 */
.start-btn:hover .btn-icon,
.start-btn:focus .btn-icon {
  opacity: 1;
  transform: translateY(-1px) scale(1.05);
}

.start-btn:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 0 10px rgba(117, 241, 255, 0.45),
    0 0 10px rgba(255, 82, 205, 0.3) !important;
}

.bg-fade-enter-active,
.bg-fade-leave-active {
  transition: opacity 0.8s ease;
}

.bg-fade-enter-from,
.bg-fade-leave-to {
  opacity: 0;
}

/* 背景网格移动的动画效果 */
@keyframes grid-drift {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(48px);
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

@keyframes glow-breathe {
  0%,
  100% {
    opacity: 0.9;
    text-shadow:
      0 0 8px rgba(117, 241, 255, 0.75),
      0 0 14px rgba(0, 145, 255, 0.45);
  }
  50% {
    opacity: 1;
    text-shadow:
      0 0 10px rgba(117, 241, 255, 1),
      0 0 20px rgba(0, 145, 255, 0.65);
  }
}

@keyframes ripple-expand {
  0% {
    opacity: 0.95;
    transform: translate(-50%, -50%) scale(0.25);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(7);
  }
}

@keyframes cursor-flicker {
  0%,
  100% {
    opacity: 0.92;
    filter: brightness(1);
  }
  50% {
    opacity: 1;
    filter: brightness(1.14);
  }
}
</style>
