<template>
  <!-- 组件不会渲染在当前组件树的位置，而是直接传送到body下面，以避免样式污染。 -->
  <Teleport to="body">
    <div v-if="enabled" class="cursor-overlay">
      <!-- 用canvas绘制激光束效果 -->
      <canvas ref="particleCanvasRef" class="particle-canvas" />
      <!-- 用div绘制鼠标指针效果 -->
      <div
        v-show="pointerVisible"
        class="cyber-cursor"
        :style="{ left: `${pointerX}px`, top: `${pointerY}px` }"
      />
      <!-- 用span绘制点击涟漪效果 -->
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
//设备像素比
let dpr = 1
let trails: TrailSegment[] = []
const maxTrailSegments = 64
const minTrailDistance = 4
const particleEnabled = ref(true)
let lastFrameTs = 0
let lastSampleX: number | null = null
let lastSampleY: number | null = null

/**
 * @function handlePointerMove
 * @param event 事件对象
 * @description 鼠标移动事件处理函数
 */
const handlePointerMove = (event: MouseEvent | PointerEvent) => {
  //保存鼠标位置，并设置是否可见
  pointerX.value = event.clientX
  pointerY.value = event.clientY
  pointerVisible.value = true

  spawnTrailSegment(event.clientX, event.clientY)
}

//设置鼠标显示
const showPointer = () => {
  pointerVisible.value = true
}

//设置鼠标隐藏
const hidePointer = () => {
  pointerVisible.value = false
}

/**
 * @function spawnRipple
 * @param event 
 * @description 产生点击涟漪效果
 */
const spawnRipple = (event: MouseEvent) => {
  //先产生一个Id
  const id = rippleId++
  //将涟漪对象入栈
  ripples.value.push({ id, x: event.clientX, y: event.clientY })

  //设置定时器，在650ms后清除该对象
  const timer = window.setTimeout(() => {
    //从涟漪数组中先找出其他对象
    ripples.value = ripples.value.filter((item) => item.id !== id)
    rippleTimers.delete(timer)
  }, 650)
  rippleTimers.add(timer)
}

const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * @function setupCanvas
 * @description 初始化画布
 */
const setupCanvas = () => {
  //通过Vue3的ref获取真实的canvas DOM节点
  const canvas = particleCanvasRef.value
  if (!canvas) return

  /**
   * 计算dpr，即设备像素比
   * window.devicePixelRatio：物理像素与 CSS 像素的比例。普通屏幕是 1，苹果 Retina 屏通常是 2，部分高端安卓可能是 3。
   * || 1：兼容极老浏览器，如果没有这个属性，默认降级为 1。
   * Math.min(2, ...) 和 Math.max(1, ...)（性能保护伞）： 为什么限制最大为 2？因为在 3x 或 4x 的屏幕上，如果按原生分辨率渲染（比如画布尺寸放大 3 倍），对于粒子系统这种需要大量计算的场景，性能会断崖式下跌。而 2 倍清淅度在人眼看来已经足够锐利了，所以这里做了一个“妥协”，上限锁死在 2。下限锁死 1 是为了防止出现 0 或负数这种异常值。
   */
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

  //设置画布的“物理尺寸”和“显示尺寸”
  //先获取浏览器窗口的宽高
  const width = window.innerWidth
  const height = window.innerHeight
  //canvas.width/height（物理尺寸/绘图缓冲区尺寸）： 决定了画布里面实际有多少个像素点。
  /**
   * 为什么要乘以 dpr？ 
   * 如果你只设置 CSS 宽高为 1920x1080，而物理尺寸也设为 1920x1080，在 2 倍屏上，这 1920 个像素点会被强行拉伸铺满 3840 个物理像素的区域，画面就会发虚、模糊。
   * 乘以 dpr 后，物理尺寸变成了 3840x2160，像素点变多了，再压缩到 1920x1080 的 CSS 区域内显示，画面就变得极其清晰（即所谓的 1个 CSS 像素对应 4个物理像素）。
   */
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  //canvas.style.width/height（显示尺寸/CSS尺寸）： 决定了画布在网页上占多大空间。这里设置为浏览器窗口的全屏大小。
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  //获取2D绘图上下文
  /**
   * @function canvas.getContext()
   * @param 2d： 表示要获取的上下文类型，这里是 2D 上下文。
   * @description 用于获取2D绘图上下文。
   * 
   * getContext 可以接收不同的字符串参数，代表你要申请哪种维度的工具箱：
   *
   * '2d'：申请二维绘图工具箱。用于画平面图形、处理图片像素、写文字等。这是最常用的。
   * 'webgl' 或 'webgl2'：申请三维（3D）绘图工具箱。用于渲染 3D 场景。著名的 3D 库 Three.js 在底层就是通过调用 canvas.getContext('webgl2') 来工作的。
   * 'webgpu'：下一代更强大的 GPU 渲染标准（目前较新浏览器开始支持）。
   * 'bitmaprenderer'：一种极高性能的图像替换工具箱，专门用于把现成的图片快速贴到 canvas 上。
   * 
   * 注意：
   * 一个 <canvas> 元素，只能获取一种上下文！
   * 如果你对一个 canvas 调用了 getContext('2d')，那么之后你再对它调用 getContext('webgl')，浏览器会返回 null。
   */
  ctx = canvas.getContext('2d')
  if (!ctx) return
  //将整个Canvas的坐标系放大dpr倍
  /**
   * @function ctx.setTransform(a,b,c,d,e,f)
   * @param a - 水平缩放(ScaleX)：X 轴放大多少倍。1是正常，2是放大2倍，-1是水平翻转。
   * @param d - 垂直缩放(ScaleY)：Y 轴放大多少倍。
   * @param e - 水平平移(TranslateX)：把坐标原点向右移动多少像素。
   * @param f - 垂直平移(TranslateY)：把坐标原点向下移动多少像素。
   * @param b - 倾斜(Skew):这两个通常一起用来做旋转。如果你要旋转角度 θ，b = Math.sin(θ)，c = -Math.cos(θ)。（如果不需要旋转或倾斜，设为 0 即可）。
   * @param c - 旋转(Rotate)
   */
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

  /**
   * @function spawnTrailSegment
   * @param x 鼠标X坐标
   * @param y 鼠标Y坐标
   * @description 生成拖行效果
   */
const spawnTrailSegment = (x: number, y: number) => {
  //如果不启用粒子效果，直接返回
  if (!particleEnabled.value) return

  //如果上一次的坐标为空，则需要重新设置
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
  window.addEventListener('pointermove', handlePointerMove)
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
  window.removeEventListener('pointermove', handlePointerMove)
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
