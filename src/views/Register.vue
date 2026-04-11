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
          <el-button class="submit-btn" :loading="isSubmitting" @click="handleRegisterSubmit">注册</el-button>
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
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import earthGif from '@/assets/登录注册背景.gif'
import { register } from '@/service/auth'
import { useAuthStore } from '@/store/auth'

const earthBgImage = `url("${earthGif}")`
const router = useRouter()
const authStore = useAuthStore()
const isSubmitting = ref(false)

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
  if (!registerFormRef.value || isSubmitting.value) {
    return
  }
  const isValid = await registerFormRef.value.validate().catch(() => false)
  if (!isValid) {
    return
  }

  try {
    isSubmitting.value = true
    const res = await register({
      email: registerForm.email,
      password: registerForm.password,
      nickname: registerForm.nickname,
    })
    if (res.code === 0) {
      authStore.setRegisterStatus(true)
      ElMessage.success(res.message || '注册成功，请登录')
      await router.push('/login')
      return
    }
    ElMessage.error(res.message || '注册失败，请重试')
  } catch (error) {
    const message = error instanceof Error ? error.message : '注册失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    isSubmitting.value = false
  }
}
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
