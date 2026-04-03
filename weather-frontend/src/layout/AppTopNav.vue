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
          <input class="search" type="text" :placeholder="props.searchPlaceholder" />
          <el-icon class="search-icon"><Search /></el-icon>
        </div>
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
        <div class="login-status" role="status" aria-live="polite">
          <span class="status-dot" />
          <span>未登录</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Cloudy, Search } from '@element-plus/icons-vue'
import githubFavicon from '@/assets/icons/github-favicon.png'

const props = withDefaults(
  defineProps<{
    githubUrl?: string
    brandText?: string
    showCenterSearch?: boolean
    searchPlaceholder?: string
  }>(),
  {
    githubUrl: 'https://github.com/wxh-cyber/weather-frontend',
    brandText: '小慕天气 · 控制台',
    showCenterSearch: true,
    searchPlaceholder: '搜索城市',
  },
)

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
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--cyber-cyan);
  font-size: 18px;
  filter: drop-shadow(0 0 8px rgba(117, 241, 255, 0.7));
  animation: cyber-breathe-soft var(--cyber-breathe-soft-duration) var(--cyber-breathe-ease) infinite;
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
}
</style>
