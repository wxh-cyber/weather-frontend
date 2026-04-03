<template>
  <div v-if="enabled" class="cursor-overlay">
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
import { onBeforeUnmount, onMounted, ref } from 'vue'

type Ripple = { id: number; x: number; y: number }

const pointerX = ref(0)
const pointerY = ref(0)
const pointerVisible = ref(false)
const ripples = ref<Ripple[]>([])
const enabled = ref(true)
let rippleId = 0

const handlePointerMove = (event: MouseEvent) => {
  pointerX.value = event.clientX
  pointerY.value = event.clientY
  pointerVisible.value = true
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

const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches

onMounted(() => {
  enabled.value = !isCoarsePointer()
  if (!enabled.value) return

  document.body.classList.add('cyber-cursor-enabled')
  window.addEventListener('mousemove', handlePointerMove)
  window.addEventListener('mouseenter', showPointer)
  document.addEventListener('mouseleave', hidePointer)
  window.addEventListener('click', spawnRipple)
  pointerVisible.value = true
})

onBeforeUnmount(() => {
  document.body.classList.remove('cyber-cursor-enabled')
  window.removeEventListener('mousemove', handlePointerMove)
  window.removeEventListener('mouseenter', showPointer)
  document.removeEventListener('mouseleave', hidePointer)
  window.removeEventListener('click', spawnRipple)
})
</script>

<style scoped>
:global(body.cyber-cursor-enabled),
:global(body.cyber-cursor-enabled *) {
  cursor: none !important;
}

.cursor-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
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
