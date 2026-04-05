<script setup lang="ts">
defineProps<{
  menus: string[]
}>()
</script>

<template>
  <header class="top-bar">
    <div class="brand">
      <span class="logo-dot" />
      <span class="brand-name">小慕天气 · 控制台</span>
    </div>
    <input class="search" type="text" placeholder="搜索网页" />
    <nav class="menu">
      <a v-for="item in menus" :key="item" href="#">{{ item }}</a>
    </nav>
  </header>
</template>

<style scoped>
.top-bar {
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background: linear-gradient(140deg, rgba(7, 24, 56, 0.8), rgba(4, 16, 38, 0.72));
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.12),
    var(--cyber-glow-md);
  backdrop-filter: blur(6px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--cyber-cyan) 0%, var(--cyber-pink) 100%);
  box-shadow: 0 0 10px rgba(117, 241, 255, 0.75);
}

.brand-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--cyber-text);
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.5);
}

.search {
  width: 100%;
  border: 1px solid rgba(117, 241, 255, 0.28);
  border-radius: 999px;
  padding: 12px 16px;
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

.menu {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.menu a {
  color: var(--cyber-text-muted);
  text-decoration: none;
  transition: color var(--cyber-ease), text-shadow var(--cyber-ease);
}

.menu a:hover {
  color: var(--cyber-cyan);
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.5);
}
</style>
