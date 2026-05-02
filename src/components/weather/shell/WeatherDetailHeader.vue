<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  navItems: ReadonlyArray<{
    key: string
    label: string
    disabled?: boolean
  }>
  activeNavKey: string
  initialSearchKeyword?: string
}>(), {
  initialSearchKeyword: '',
})

const emit = defineEmits<{
  (e: 'nav-select', navKey: string): void
  (e: 'search-submit', keyword: string): void
}>()

const searchKeyword = ref(props.initialSearchKeyword)

const submitSearch = () => {
  emit('search-submit', searchKeyword.value.trim())
}
</script>

<template>
  <header class="dashboard-head" data-testid="weather-detail-header">
    <div class="dashboard-head__inner">
      <nav class="menu" aria-label="城市详情导航">
        <button
          v-for="item in props.navItems"
          :key="item.key"
          type="button"
          class="menu-button"
          :class="{
            'is-current': item.key === props.activeNavKey,
            'is-disabled': item.disabled,
          }"
          :disabled="item.disabled"
          @click="emit('nav-select', item.key)"
        >
          <span class="menu-button__label">{{ item.label }}</span>
        </button>
      </nav>

      <div class="dashboard-search">
        <div class="search-wrap">
          <input
            v-model="searchKeyword"
            class="search"
            type="text"
            placeholder="搜索城市"
            @keydown.enter="submitSearch"
          />
          <button
            type="button"
            class="search-trigger"
            aria-label="搜索城市"
            @click="submitSearch"
          >
            <el-icon class="search-icon"><Search /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dashboard-head {
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background: linear-gradient(140deg, rgba(7, 24, 56, 0.8), rgba(4, 16, 38, 0.72));
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.12),
    var(--cyber-glow-md);
  backdrop-filter: blur(6px);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
}

.dashboard-head__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
}

.menu {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.menu-button {
  position: relative;
  min-width: 132px;
  padding: 10px 18px;
  border: 1px solid rgba(117, 241, 255, 0.24);
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(5, 26, 60, 0.88), rgba(3, 14, 36, 0.92)),
    rgba(4, 14, 34, 0.9);
  color: rgba(214, 242, 255, 0.82);
  font-size: 13px;
  letter-spacing: 0.08em;
  cursor: pointer;
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.06),
    0 0 0 rgba(117, 241, 255, 0);
  transition:
    color var(--cyber-ease),
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    transform var(--cyber-ease),
    background var(--cyber-ease);
}

.menu-button::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(117, 241, 255, 0.12), rgba(117, 241, 255, 0));
  opacity: 0.42;
  pointer-events: none;
}

.menu-button:hover:not(:disabled) {
  color: var(--cyber-cyan);
  border-color: rgba(117, 241, 255, 0.46);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.12),
    0 0 16px rgba(117, 241, 255, 0.18);
  transform: translateY(-1px);
}

.menu-button.is-current {
  color: #03121d;
  border-color: rgba(117, 241, 255, 0.7);
  background:
    linear-gradient(135deg, rgba(117, 241, 255, 0.96), rgba(153, 251, 255, 0.86)),
    rgba(117, 241, 255, 0.96);
  box-shadow:
    inset 0 0 18px rgba(255, 255, 255, 0.2),
    0 0 22px rgba(117, 241, 255, 0.28);
}

.menu-button.is-disabled {
  opacity: 0.44;
  cursor: not-allowed;
}

.menu-button__label {
  position: relative;
  z-index: 1;
}

.dashboard-search {
  justify-self: end;
  width: min(320px, 100%);
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(117, 241, 255, 0.28);
  background:
    linear-gradient(135deg, rgba(6, 24, 54, 0.84), rgba(3, 12, 28, 0.96)),
    rgba(4, 12, 28, 0.92);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.08),
    0 0 20px rgba(117, 241, 255, 0.08);
}

.search-wrap:focus-within {
  border-color: rgba(117, 241, 255, 0.56);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.1),
    0 0 22px rgba(117, 241, 255, 0.18);
}

.search {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: rgba(230, 248, 255, 0.92);
  font-size: 14px;
  outline: none;
}

.search::placeholder {
  color: rgba(173, 213, 255, 0.42);
}

.search-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(117, 241, 255, 0.22);
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(117, 241, 255, 0.22), rgba(255, 82, 205, 0.18));
  color: var(--cyber-cyan);
  cursor: pointer;
  transition:
    transform var(--cyber-ease),
    box-shadow var(--cyber-ease),
    border-color var(--cyber-ease);
}

.search-trigger:hover {
  transform: translateY(-1px);
  border-color: rgba(117, 241, 255, 0.52);
  box-shadow: 0 0 16px rgba(117, 241, 255, 0.22);
}

.search-icon {
  font-size: 16px;
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-head {
    animation: none;
  }
}

@media (max-width: 940px) {
  .dashboard-head__inner {
    grid-template-columns: 1fr;
  }

  .dashboard-search {
    justify-self: stretch;
    width: 100%;
  }
}
</style>
