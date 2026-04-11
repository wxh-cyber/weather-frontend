import { createRouter, createWebHistory } from 'vue-router'
import Start from '../views/Start.vue'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Center from '../views/Center.vue'
import List from '../views/List.vue'
import LoginList from '../views/LoginList.vue'
import CityDetail from '../views/CityDetail.vue'

const hasStoredAuth = () => {
  if (typeof window === 'undefined') {
    return false
  }

  const token = localStorage.getItem('auth_token')
  const user = localStorage.getItem('auth_user')
  return Boolean(token && user)
}

export const resolveProtectedRoute = (toPath: string, requiresAuth: boolean) => {
  if (!requiresAuth || hasStoredAuth()) {
    return true
  }

  return {
    path: '/login',
    query: {
      reason: 'unauthorized',
      redirect: toPath,
    },
  }
}

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
      component: Login,     //登录页面
      meta: { navVariant: 'start' },
    },
    {
      path: '/register',
      name: 'register',
      component: Register,     //注册页面
      meta: { navVariant: 'start' },
    },
    {
      path: '/center',
      name: 'center',
      component: Center,     //个人中心页面
      meta: { navVariant: 'home' },
    },
    {
      path: '/list',
      name: 'list',
      component: List,     //城市列表页面
      meta: { navVariant: 'home' },
    },
    {
      path: '/login-list',
      name: 'login-list',
      component: LoginList,     //登录记录页面
      meta: { navVariant: 'home', requiresAuth: true },
    },
    {
      path: '/weather/:cityName',
      name: 'city-detail',
      component: CityDetail,     //城市详情页面
      meta: { navVariant: 'home' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/weather',
    },
  ],
})

// 在路由跳转前检查是否需要登录
router.beforeEach((to) => resolveProtectedRoute(to.fullPath, Boolean(to.meta.requiresAuth)))

export default router
