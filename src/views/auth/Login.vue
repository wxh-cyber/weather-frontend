<template>
  <main class="auth-page">
    <div class="earth-bg-layer" />
    <div class="auth-overlay" />
    <div class="cyber-grid-layer" />
    <section class="auth-card">
      <header class="auth-heading">
        <div class="title-row">
          <el-icon class="heading-icon"><UserFilled /></el-icon>
          <h1>登录</h1>
        </div>
        <p class="subtitle">连接你的天气控制台账号</p>
      </header>

      <el-form ref="loginFormRef" class="auth-form" :model="loginForm" :rules="loginRules" label-position="top">
        <el-form-item prop="email">
          <template #label><span class="field-label">邮箱</span></template>
          <el-input v-model="loginForm.email" type="email" placeholder="请输入邮箱" autocomplete="email" />
        </el-form-item>
        <el-form-item prop="password">
          <template #label><span class="field-label">密码</span></template>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            show-password
          />
        </el-form-item>
        
        <!-- 记住我复选框 -->
        <el-form-item class="remember-item">
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
        </el-form-item>
        <el-form-item class="submit-item">
          <el-button class="submit-btn" :loading="isSubmitting" @click="handleLoginSubmit">登录</el-button>
        </el-form-item>
      </el-form>

      <p class="hint">
        没有账号？<router-link to="/register">请注册</router-link>
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { UserFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import earthGif from '@/assets/animations/auth/登录注册背景.gif'
import { getProfile, login } from '@/service/auth'
import { useAuthStore } from '@/store/auth'
import { useCityStore } from '@/store/city'

const earthBgImage = `url("${earthGif}")`
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cityStore = useCityStore()
const isSubmitting = ref(false)
const rememberMe = ref(false)
const rememberedCredentialsStorageKey = 'weather-login-remembered-credentials'

interface LoginForm {
  email: string
  password: string
}

interface RememberedCredentials {
  email: string
  password: string
}

const loginFormRef = ref<FormInstance>()
const loginForm = reactive<LoginForm>({
  email: '',
  password: '',
})

const loginRules: FormRules<LoginForm> = {
  email: [
    { required: true, message: '请输入邮箱', trigger: ['blur', 'change'] },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
  password: [{ required: true, message: '请输入密码', trigger: ['blur', 'change'] }],
}

const readRememberedCredentials = (): RememberedCredentials | null => {
  try {
    const rawValue = window.localStorage.getItem(rememberedCredentialsStorageKey)
    if (!rawValue) {
      return null
    }
    const parsed = JSON.parse(rawValue) as Partial<RememberedCredentials>
    if (typeof parsed.email !== 'string' || typeof parsed.password !== 'string') {
      return null
    }
    return {
      email: parsed.email,
      password: parsed.password,
    }
  } catch {
    return null
  }
}

const restoreRememberedCredentials = () => {
  const rememberedCredentials = readRememberedCredentials()
  if (!rememberedCredentials) {
    return
  }
  loginForm.email = rememberedCredentials.email
  loginForm.password = rememberedCredentials.password
  rememberMe.value = true
}

const persistRememberedCredentials = () => {
  try {
    window.localStorage.setItem(
      rememberedCredentialsStorageKey,
      JSON.stringify({
        email: loginForm.email,
        password: loginForm.password,
      }),
    )
  } catch {
    // 本地存储不可用时不影响登录主流程
  }
}

const clearRememberedCredentials = () => {
  try {
    window.localStorage.removeItem(rememberedCredentialsStorageKey)
  } catch {
    // 本地存储不可用时不影响登录主流程
  }
}

const consumeRouteReason = async () => {
  const reason = typeof route.query.reason === 'string' ? route.query.reason : ''
  if (reason === 'expired') {
    ElMessage.warning('登录已过期，请重新登录')
  }
  if (reason === 'unauthorized') {
    ElMessage.warning('请先登录后再查看登录列表')
  }
  if (!reason) {
    return
  }

  const nextQuery = { ...route.query }
  delete nextQuery.reason
  await router.replace({ path: route.path, query: nextQuery })
}

const handleLoginSubmit = async () => {
  if (!loginFormRef.value || isSubmitting.value) {
    return
  }
  const isValid = await loginFormRef.value.validate().catch(() => false)
  if (!isValid) {
    return
  }

  try {
    isSubmitting.value = true
    const res = await login({
      email: loginForm.email,
      password: loginForm.password,
    })
    if (res.code === 0) {
      if (rememberMe.value) {
        persistRememberedCredentials()
      } else {
        clearRememberedCredentials()
      }
      authStore.setAuth(res.data.token, res.data.user)
      cityStore.syncFromStorage()
      try {
        const profileRes = await getProfile()
        if (profileRes.code === 0) {
          authStore.updateUserProfile(profileRes.data)
        }
      } catch {
        // 资料同步失败不影响登录主流程，保留已登录状态并继续跳转
      }
      ElMessage.success(res.message || '登录成功')
      const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : '/weather'
      await router.push(redirectTarget)
      return
    }
    ElMessage.error(res.message || '登录失败，请重试')
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  restoreRememberedCredentials()
  await consumeRouteReason()
})
</script>

<style scoped>
@import '../../assets/styles/auth-page.css';

.earth-bg-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: v-bind(earthBgImage);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transform: scale(1.04);
}

.remember-item {
  margin-top: -0.25rem;
  margin-bottom: 0.25rem;
}

.remember-item :deep(.el-checkbox) {
  color: rgba(235, 245, 255, 0.86);
  font-size: 0.95rem;
}

.remember-item :deep(.el-checkbox__label) {
  color: inherit;
}
</style>
