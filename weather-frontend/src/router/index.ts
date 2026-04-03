import { createRouter, createWebHistory } from 'vue-router'
import StartView from '../views/StartView.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'start',
      component: StartView, // 开始页面
      meta: { navVariant: 'start' },
    },
    {
      path: '/weather',
      name: 'weather',
      component: HomeView, // 天气主页面
      alias: ['/weather/'],
      meta: { navVariant: 'home' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/weather',
    },
  ],
})

export default router
