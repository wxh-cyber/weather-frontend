<template>
  <main class="auth-page">
    <div class="earth-bg-layer" />
    <div class="auth-overlay" />
    <div class="cyber-grid-layer" />
    <section class="auth-card">
      <header class="auth-heading">
        <div class="title-row">
          <el-icon class="heading-icon"><CirclePlusFilled /></el-icon>
          <h1>注册</h1>
        </div>
        <p class="subtitle">创建你的天气控制台账号</p>
      </header>

      <el-form
        ref="registerFormRef"
        class="auth-form"
        :model="registerForm"
        :rules="registerRules"
        label-position="top"
      >
        <el-form-item prop="email">
          <template #label><span class="field-label">注册邮箱</span></template>
          <el-input v-model="registerForm.email" type="email" placeholder="请输入注册邮箱" autocomplete="email" />
        </el-form-item>
        <el-form-item prop="nickname">
          <template #label><span class="field-label">用户昵称</span></template>
          <el-input v-model="registerForm.nickname" type="text" placeholder="请输入用户昵称" autocomplete="nickname" />
        </el-form-item>
        <el-form-item prop="password">
          <template #label><span class="field-label">密码</span></template>
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="new-password"
            show-password
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <template #label><span class="field-label">确认密码</span></template>
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            autocomplete="new-password"
            show-password
          />
        </el-form-item>
        <el-form-item class="submit-item">
          <el-button class="submit-btn" @click="handleRegisterSubmit">注册</el-button>
        </el-form-item>
      </el-form>

      <p class="hint">
        已有账号？<router-link to="/login">去登录</router-link>
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { CirclePlusFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref, watch } from 'vue'
import earthGif from '@/assets/登录注册背景.gif'

const earthBgImage = `url("${earthGif}")`

interface RegisterForm {
  email: string
  nickname: string
  password: string
  confirmPassword: string
}

const registerFormRef = ref<FormInstance>()
const registerForm = reactive<RegisterForm>({
  email: '',
  nickname: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
    return
  }
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const registerRules: FormRules<RegisterForm> = {
  email: [
    { required: true, message: '请输入注册邮箱', trigger: ['blur', 'change'] },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
  nickname: [{ required: true, message: '请输入用户昵称', trigger: ['blur', 'change'] }],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'change'] },
    { min: 6, message: '密码长度至少为 6 位', trigger: ['blur', 'change'] },
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: ['blur', 'change'] }],
}

watch(
  () => registerForm.password,
  () => {
    if (registerForm.confirmPassword) {
      registerFormRef.value?.validateField('confirmPassword')
    }
  },
)

const handleRegisterSubmit = async () => {
  if (!registerFormRef.value) {
    return
  }
  const isValid = await registerFormRef.value.validate().catch(() => false)
  if (!isValid) {
    return
  }
}
</script>

<style scoped>
.auth-page {
  position: relative;
  min-height: calc(100vh - var(--app-nav-height));
  padding: 32px 16px;
  display: grid;
  place-items: center;
  overflow: hidden;
}

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

.auth-overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(circle at 16% 15%, rgba(0, 255, 255, 0.16), transparent 36%),
    radial-gradient(circle at 86% 84%, rgba(255, 0, 153, 0.15), transparent 46%),
    linear-gradient(180deg, rgba(4, 16, 38, 0.58) 0%, rgba(2, 8, 22, 0.76) 100%);
}

.auth-card {
  width: min(460px, 100%);
  position: relative;
  z-index: 1;
  padding: 26px 24px;
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background: var(--cyber-glass-bg);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.12),
    var(--cyber-glow-md);
  backdrop-filter: blur(6px);
  animation: cyber-breathe-subtle var(--cyber-breathe-subtle-duration) var(--cyber-breathe-ease) infinite;
}

.auth-heading {
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
}

.title-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.heading-icon {
  font-size: 28px;
  color: var(--cyber-cyan);
  filter: drop-shadow(0 0 10px rgba(117, 241, 255, 0.65));
}

h1 {
  font-size: 30px;
  margin: 0;
  color: var(--cyber-cyan);
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.5);
}

.subtitle {
  text-align: center;
  margin: 6px 0 0;
  color: var(--cyber-text-muted);
}

.auth-form {
  margin-top: 18px;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.field-label {
  color: var(--cyber-text-muted);
}

.auth-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  background: rgba(5, 18, 54, 0.78);
  box-shadow: inset 0 0 0 1px rgba(117, 241, 255, 0.32);
}

.auth-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    inset 0 0 0 1px rgba(117, 241, 255, 0.62),
    0 0 0 3px rgba(117, 241, 255, 0.14);
}

.auth-form :deep(.el-input__inner) {
  color: var(--cyber-text);
}

.submit-item {
  margin-top: 6px;
  margin-bottom: 0;
}

.submit-btn {
  width: 100%;
  min-height: 42px;
  border: 1px solid rgba(117, 241, 255, 0.64);
  border-radius: 10px;
  padding: 11px 0 !important;
  background: linear-gradient(135deg, rgba(0, 214, 255, 0.2), rgba(255, 0, 153, 0.16));
  color: var(--cyber-cyan);
  cursor: pointer;
  box-shadow: inset 0 0 12px rgba(117, 241, 255, 0.34);
  transition: transform var(--cyber-ease), filter var(--cyber-ease), box-shadow var(--cyber-ease);
}

.submit-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.48),
    0 0 12px rgba(117, 241, 255, 0.3);
}

.hint {
  margin-top: 14px;
  color: var(--cyber-text-muted);
}

.hint a {
  color: var(--cyber-cyan);
  text-decoration: none;
}

.hint a:hover {
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.58);
}

@media (max-width: 640px) {
  .auth-page {
    min-height: calc(100vh - var(--app-nav-height-mobile));
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-card {
    animation: none;
  }
}
</style>
