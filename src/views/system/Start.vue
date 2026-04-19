<template>
  <div class="start-container">
    <!-- 给背景增加过渡效果 -->
    <!-- 使用out-in模式，当背景切换时，旧背景淡出，新背景淡入 -->
    <Transition name="bg-fade" mode="out-in">
      <div :key="currentBackground" class="bg-layer" :style="{ backgroundImage: `url('${currentBackground}')` }" />
    </Transition>
    <div class="cyber-grid-layer" />

    <div class="center-box">
      <p class="welcome-text">欢迎使用小慕天气！</p>
      <p class="time">{{ currentTime }}</p>
      <el-button class="start-btn" @click="goToWeather">
        <el-icon class="btn-icon"><Cloudy /></el-icon>
        <span>开启天气查询</span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Cloudy } from '@element-plus/icons-vue'
import sunnyBg1 from '@/assets/晴天(1).gif';
import sunnyBg2 from '@/assets/晴天(2).gif';
import rainyBg1 from '@/assets/雨天(1).gif';
import rainyBg2 from '@/assets/雨天(2).gif';
import snowyBg1 from '@/assets/雪天(1).gif';
import snowyBg2 from '@/assets/雪天(2).gif';

const currentTime = ref('');            //当前时间
const currentBgIndex = ref(0);          //当前背景索引
const backgrounds = [sunnyBg1, sunnyBg2, rainyBg1, rainyBg2, snowyBg1, snowyBg2];     //背景图片数组
const currentBackground = computed(() => backgrounds[currentBgIndex.value]);       //当前背景图片

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

//获取路由器实例
const router = useRouter()

const goToWeather = () => {
  router.push('/weather');
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
  src: url('@/assets/fonts/DSEG7Classic-Regular.woff2') format('woff2');
  font-style: normal;
  font-weight: 400;
}

/* 最外层的相关样式 */
.start-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: calc(100vh - var(--app-nav-height));
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 给start-container增加装饰性背景层 */
.start-container::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(circle at 20% 15%, rgba(0, 255, 255, 0.2), transparent 40%),
    radial-gradient(circle at 85% 80%, rgba(255, 0, 153, 0.18), transparent 45%),
    linear-gradient(180deg, rgba(6, 14, 32, 0.35), rgba(3, 7, 18, 0.55));
  pointer-events: none;
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
  border: 1px solid var(--cyber-glass-border);
  background: var(--cyber-glass-bg);
  box-shadow:
    inset 0 0 20px rgba(117, 241, 255, 0.08),
    var(--cyber-glow-md);
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
  color: var(--cyber-cyan);
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
  backdrop-filter: blur(3px);
  background: linear-gradient(135deg, rgba(0, 214, 255, 0.16), rgba(255, 0, 153, 0.08)) !important;
  border-color: rgba(117, 241, 255, 0.75) !important;
  color: var(--cyber-cyan) !important;
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
  color: var(--cyber-cyan);
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

@media (max-width: 640px) {
  .start-container {
    min-height: calc(100vh - var(--app-nav-height-mobile));
  }
}
</style>
