<script setup lang="ts">
defineProps<{
  menus: string[]
}>()
</script>

<template>
  <header class="top-bar">
    <div class="brand">
      <span class="logo-dot" />
      <span class="brand-name">MSN 天气</span>
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
  background: rgba(255, 255, 255, 0.08);
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
  background: linear-gradient(135deg, #57ddff 0%, #6977ff 100%);
}

.brand-name {
  font-size: 24px;
  font-weight: 700;
}

.search {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 12px 16px;
  background: rgba(5, 18, 54, 0.6);
  color: #fff;
}

.menu {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.menu a {
  color: #c8d2ff;
  text-decoration: none;
}
</style>
