<template>
  <div class="start-container">
    <!-- 给背景增加过渡效果 -->
    <Transition name="bg-fade" mode="out-in">
      <div :key="currentBackground" class="bg-layer" :style="{ backgroundImage: `url('${currentBackground}')` }" />
    </Transition>

    <div class="center-box">
      <p class="time">{{ currentTime }}</p>
      <el-button class="start-btn" type="warning">开启天气查询</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import sunnyBg1 from '@/assets/晴天(1).gif'
import sunnyBg2 from '@/assets/晴天(2).gif'
import rainyBg1 from '@/assets/雨天(1).gif'
import rainyBg2 from '@/assets/雨天(2).gif'
import snowyBg1 from '@/assets/雪天(1).gif'
import snowyBg2 from '@/assets/雪天(2).gif'

const currentTime = ref('')
const currentBgIndex = ref(0)
const backgrounds = [sunnyBg1, sunnyBg2,rainyBg1, rainyBg2,snowyBg1,snowyBg2]
const currentBackground = computed(() => backgrounds[currentBgIndex.value])

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

let timer: ReturnType<typeof setInterval> | null = null
let bgTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  formatNow()
  timer = setInterval(formatNow, 1000)
  bgTimer = setInterval(() => {
    currentBgIndex.value = (currentBgIndex.value + 1) % backgrounds.length
  }, 5000)
})

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
.start-container {
  position: relative;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.bg-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.center-box {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.time {
  font-size: 28px;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
}

.start-btn {
  background: transparent !important;
  border-color: rgba(255, 255, 255, 0.92) !important;
  color: #ffffff !important;
  box-shadow: none;
}

.start-btn:hover,
.start-btn:focus {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: #ffffff !important;
  color: #ffffff !important;
}

.bg-fade-enter-active,
.bg-fade-leave-active {
  transition: opacity 0.8s ease;
}

.bg-fade-enter-from,
.bg-fade-leave-to {
  opacity: 0;
}
</style>
