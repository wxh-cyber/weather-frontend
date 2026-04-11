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
import earthGif from '@/assets/登录注册背景.gif'
import { login } from '@/service/auth'
import { useAuthStore } from '@/store/auth'

const earthBgImage = `url("${earthGif}")`
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isSubmitting = ref(false)

interface LoginForm {
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
      authStore.setAuth(res.data.token, res.data.user)
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
  await consumeRouteReason()
})
</script>

<style scoped>
@import '../assets/auth-page.css';

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
</style>
