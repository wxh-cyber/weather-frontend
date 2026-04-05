import { createRouter, createWebHistory } from 'vue-router'
import Start from '../views/Start.vue'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Center from '../views/Center.vue'
import List from '../views/List.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'start',
      component: Start, // 开始页面
      meta: { navVariant: 'start' },
    },
    {
      path: '/weather',
      name: 'weather',
      component: Home, // 天气主页面
      alias: ['/weather/'],
      meta: { navVariant: 'home' },
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { navVariant: 'start' },
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: { navVariant: 'start' },
    },
    {
      path: '/center',
      name: 'center',
      component: Center,
      meta: { navVariant: 'home' },
    },
    {
      path: '/list',
      name: 'list',
      component: List,
      meta: { navVariant: 'home' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/weather',
    },
  ],
})

export default router
