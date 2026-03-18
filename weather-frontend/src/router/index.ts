import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'start',
      component: () => import('../views/StartView.vue'), // 开始页面
    },
    {
      path: '/weather',
      name: 'weather',
      component: () => import('../views/HomeView.vue'), // 天气主页面
    },
  ],
})

export default router
