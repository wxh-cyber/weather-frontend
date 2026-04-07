<template>
  <Teleport to="body">
    <div v-if="enabled" class="cursor-overlay">
      <canvas ref="particleCanvasRef" class="particle-canvas" />
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
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

//定义涟漪类型
type Ripple = { id: number; x: number; y: number }
type TrailSegment = {
  x: number
  y: number
  px: number
  py: number
  life: number
  maxLife: number
  width: number
  intensity: number
}

//记录鼠标位置
const pointerX = ref(0)
const pointerY = ref(0)

//记录鼠标是否可见
const pointerVisible = ref(false)

//记录点击涟漪
const ripples = ref<Ripple[]>([])

//记录是否启用
const enabled = ref(true)
const particleCanvasRef = ref<HTMLCanvasElement | null>(null)

//记录涟漪ID
let rippleId = 0
const rippleTimers = new Set<number>()

let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let dpr = 1
let trails: TrailSegment[] = []
const maxTrailSegments = 64
const minTrailDistance = 4
const particleEnabled = ref(true)
let lastFrameTs = 0
let lastSampleX: number | null = null
let lastSampleY: number | null = null

//处理鼠标移动事件
const handlePointerMove = (event: MouseEvent) => {
  //保存鼠标位置，并设置是否可见
  pointerX.value = event.clientX
  pointerY.value = event.clientY
  pointerVisible.value = true

  spawnTrailSegment(event.clientX, event.clientY)
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
  const timer = window.setTimeout(() => {
    ripples.value = ripples.value.filter((item) => item.id !== id)
    rippleTimers.delete(timer)
  }, 650)
  rippleTimers.add(timer)
}

const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const setupCanvas = () => {
  const canvas = particleCanvasRef.value
  if (!canvas) return

  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
  const width = window.innerWidth
  const height = window.innerHeight
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

const spawnTrailSegment = (x: number, y: number) => {
  if (!particleEnabled.value) return

  if (lastSampleX === null || lastSampleY === null) {
    lastSampleX = x
    lastSampleY = y
    return
  }

  const dx = x - lastSampleX
  const dy = y - lastSampleY
  const distance = Math.hypot(dx, dy)
  if (distance < minTrailDistance) {
    return
  }

  const maxLife = 140 + Math.min(100, distance * 5)
  const width = 1 + Math.min(1.2, distance * 0.05)
  const intensity = Math.min(1, 0.45 + distance * 0.03)

  trails.push({
    x,
    y,
    px: lastSampleX,
    py: lastSampleY,
    life: maxLife,
    maxLife,
    width,
    intensity,
  })

  if (trails.length > maxTrailSegments) {
    trails.splice(0, trails.length - maxTrailSegments)
  }

  lastSampleX = x
  lastSampleY = y
}

const animateParticles = (timestamp: number) => {
  if (!ctx || !particleCanvasRef.value) return

  if (!lastFrameTs) {
    lastFrameTs = timestamp
  }
  const rawDt = timestamp - lastFrameTs
  const dt = Math.min(34, Math.max(10, rawDt))
  lastFrameTs = timestamp

  const width = particleCanvasRef.value.width / dpr
  const height = particleCanvasRef.value.height / dpr
  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  let writeIndex = 0
  for (let i = 0; i < trails.length; i += 1) {
    const trail = trails[i]
    if (!trail) {
      continue
    }
    trail.life -= dt
    if (trail.life <= 0) {
      continue
    }

    const progress = Math.max(0, trail.life / trail.maxLife)
    const trailDx = trail.x - trail.px
    const trailDy = trail.y - trail.py
    const length = Math.max(1, Math.hypot(trailDx, trailDy))
    const dirX = trailDx / length
    const dirY = trailDy / length

    // 沿拖拽方向轻微位移，形成“拖行一段后消失”的感觉
    const drift = (dt / 16) * (0.28 + trail.intensity * 0.08)
    trail.x += dirX * drift
    trail.y += dirY * drift
    trail.px += dirX * drift
    trail.py += dirY * drift

    const opacity = progress * trail.intensity

    // 主激光束（青蓝收束）
    ctx.beginPath()
    ctx.strokeStyle = `hsla(194, 100%, 70%, ${opacity * 0.95})`
    ctx.lineWidth = trail.width * (0.85 + progress * 0.5)
    ctx.lineCap = 'round'
    ctx.shadowColor = `hsla(194, 100%, 72%, ${opacity * 0.82})`
    ctx.shadowBlur = 8
    ctx.moveTo(trail.px, trail.py)
    ctx.lineTo(trail.x, trail.y)
    ctx.stroke()

    // 副束弱偏移，保留赛博感但不发散
    const offsetX = -dirY * 0.55
    const offsetY = dirX * 0.55
    ctx.beginPath()
    ctx.strokeStyle = `hsla(318, 100%, 72%, ${opacity * 0.24})`
    ctx.lineWidth = Math.max(0.8, trail.width * 0.58)
    ctx.shadowColor = `hsla(318, 100%, 72%, ${opacity * 0.3})`
    ctx.shadowBlur = 4
    ctx.moveTo(trail.px + offsetX, trail.py + offsetY)
    ctx.lineTo(trail.x + offsetX, trail.y + offsetY)
    ctx.stroke()

    // 只在强度较高时画头部火花，避免满屏闪烁
    if (trail.intensity > 0.74) {
      ctx.beginPath()
      ctx.fillStyle = `hsla(192, 100%, 78%, ${opacity * 0.75})`
      ctx.shadowColor = `hsla(192, 100%, 78%, ${opacity * 0.7})`
      ctx.shadowBlur = 7
      ctx.arc(trail.x, trail.y, Math.max(0.8, trail.width * 0.44), 0, Math.PI * 2)
      ctx.fill()
    }

    trails[writeIndex] = trail
    writeIndex += 1
  }
  trails.length = writeIndex
  ctx.restore()

  rafId = window.requestAnimationFrame(animateParticles)
}

const handleResize = () => {
  setupCanvas()
}

onMounted(() => {
  enabled.value = !isCoarsePointer()
  if (!enabled.value) return
  particleEnabled.value = !prefersReducedMotion()

  document.body.classList.add('cyber-cursor-enabled')
  setupCanvas()
  if (particleEnabled.value) {
    rafId = window.requestAnimationFrame(animateParticles)
  }
  window.addEventListener('mousemove', handlePointerMove)
  window.addEventListener('mouseenter', showPointer)
  window.addEventListener('resize', handleResize)
  document.addEventListener('mouseleave', hidePointer)
  window.addEventListener('click', spawnRipple)
  pointerVisible.value = true
})

onBeforeUnmount(() => {
  document.body.classList.remove('cyber-cursor-enabled')
  window.cancelAnimationFrame(rafId)
  trails = []
  lastFrameTs = 0
  lastSampleX = null
  lastSampleY = null
  rippleTimers.forEach((timer) => window.clearTimeout(timer))
  rippleTimers.clear()
  window.removeEventListener('mousemove', handlePointerMove)
  window.removeEventListener('mouseenter', showPointer)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('mouseleave', hidePointer)
  window.removeEventListener('click', spawnRipple)
})
</script>

<style scoped>
/* 
    加上 :global() 后，括号里的选择器就会被当作全局普通 CSS，不会进行哈希化编译。
    这样可以确保它能精准匹配到 HTML 中真实的 <body> 标签。
*/
:global(body.cyber-cursor-enabled),
:global(body.cyber-cursor-enabled *) {
  cursor: none !important;            /* 隐藏原先鼠标形状 */
}

.cursor-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.particle-canvas {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;
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
