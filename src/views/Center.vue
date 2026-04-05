<template>
  <main class="center-page">
    <div class="cyber-grid-layer" />
    <div class="center-container">
      <aside class="left-panel">
        <h2>用户中心</h2>
        <p>个人资料</p>
      </aside>

      <section class="right-panel">
        <h3 class="section-title">用户信息</h3>
        <div class="profile-row">
          <span class="label">用户头像</span>
          <el-avatar class="avatar" :size="66">{{ avatarText }}</el-avatar>
        </div>
        <div class="profile-row">
          <span class="label">注册邮箱</span>
          <el-input v-model="form.email" disabled />
        </div>
        <div class="profile-row">
          <span class="label">用户昵称</span>
          <el-input v-model="form.nickname" :disabled="!isEditing" />
        </div>

        <h3 class="section-title contact-title">联系方式</h3>
        <div class="profile-row">
          <span class="label">手机号码</span>
          <el-input v-model="form.phone" :disabled="!isEditing" />
        </div>
        <div class="profile-row">
          <span class="label">QQ账号</span>
          <el-input v-model="form.qq" :disabled="!isEditing" />
        </div>
        <div class="profile-row">
          <span class="label">微信账号</span>
          <el-input v-model="form.wechat" :disabled="!isEditing" />
        </div>

        <div class="action-row">
          <el-button class="save-btn" :loading="isSubmitting" @click="handleActionClick">
            {{ actionText }}
          </el-button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getProfile, updateProfile } from '@/service/auth'
import { useAuthStore } from '@/store/auth'

type ProfileForm = {
  email: string
  nickname: string
  phone: string
  qq: string
  wechat: string
}

const router = useRouter()
const authStore = useAuthStore()
const isEditing = ref(false)
const isSubmitting = ref(false)
const form = reactive<ProfileForm>({
  email: '',
  nickname: '',
  phone: '',
  qq: '',
  wechat: '',
})
const originalForm = reactive<Omit<ProfileForm, 'email'>>({
  nickname: '',
  phone: '',
  qq: '',
  wechat: '',
})

const avatarText = computed(() => (form.nickname || form.email || 'U').slice(0, 1).toUpperCase())
const hasChanges = computed(
  () =>
    isEditing.value &&
    (form.nickname !== originalForm.nickname ||
      form.phone !== originalForm.phone ||
      form.qq !== originalForm.qq ||
      form.wechat !== originalForm.wechat),
)
const actionText = computed(() => (hasChanges.value ? '保存信息' : '修改信息'))

const loadProfile = async () => {
  if (!authStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    await router.push('/login')
    return
  }

  try {
    const res = await getProfile()
    form.email = res.data.email || ''
    form.nickname = res.data.nickname || ''
    form.phone = res.data.phone || ''
    form.qq = res.data.qq || ''
    form.wechat = res.data.wechat || ''

    originalForm.nickname = form.nickname
    originalForm.phone = form.phone
    originalForm.qq = form.qq
    originalForm.wechat = form.wechat
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取用户资料失败'
    ElMessage.error(message)
  }
}

const handleActionClick = async () => {
  if (!isEditing.value) {
    isEditing.value = true
    return
  }

  if (!hasChanges.value || isSubmitting.value) {
    return
  }

  try {
    isSubmitting.value = true
    const res = await updateProfile({
      nickname: form.nickname,
      phone: form.phone,
      qq: form.qq,
      wechat: form.wechat,
    })
    form.nickname = res.data.nickname || ''
    form.phone = res.data.phone || ''
    form.qq = res.data.qq || ''
    form.wechat = res.data.wechat || ''

    originalForm.nickname = form.nickname
    originalForm.phone = form.phone
    originalForm.qq = form.qq
    originalForm.wechat = form.wechat
    authStore.updateUserProfile({
      email: form.email,
      nickname: form.nickname,
      phone: form.phone,
      qq: form.qq,
      wechat: form.wechat,
    })
    isEditing.value = false
    ElMessage.success(res.message || '保存成功')
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.center-page {
  position: relative;
  min-height: calc(100vh - var(--app-nav-height));
  padding: 26px 16px 34px;
  background:
    radial-gradient(circle at 18% 10%, rgba(0, 255, 255, 0.18), transparent 38%),
    radial-gradient(circle at 85% 85%, rgba(255, 0, 153, 0.14), transparent 45%),
    linear-gradient(180deg, #051028 0%, #020816 100%);
  color: var(--cyber-text);
}

.center-container {
  position: relative;
  z-index: 1;
  width: min(1120px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
}

.left-panel,
.right-panel {
  border-radius: 16px;
  border: 1px solid var(--cyber-glass-border);
  background: var(--cyber-glass-bg);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.1),
    var(--cyber-glow-md);
  backdrop-filter: blur(6px);
}

.left-panel {
  padding: 24px 18px;
}

.left-panel h2 {
  margin: 0;
  font-size: 24px;
  color: var(--cyber-cyan);
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.52);
}

.left-panel p {
  margin-top: 12px;
  color: var(--cyber-text-muted);
  letter-spacing: 0.08em;
}

.right-panel {
  padding: 22px 22px 18px;
}

.section-title {
  margin: 0;
  font-size: 22px;
  color: var(--cyber-cyan);
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.45);
}

.contact-title {
  margin-top: 20px;
}

.profile-row {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.label {
  color: var(--cyber-text-muted);
  font-size: 14px;
}

.avatar {
  border: 1px solid rgba(117, 241, 255, 0.55);
  background: rgba(3, 20, 45, 0.75);
  color: var(--cyber-cyan);
  box-shadow: 0 0 12px rgba(117, 241, 255, 0.34);
}

.right-panel :deep(.el-input__wrapper) {
  border-radius: 10px;
  background: rgba(5, 18, 54, 0.78);
  box-shadow: inset 0 0 0 1px rgba(117, 241, 255, 0.32);
}

.right-panel :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    inset 0 0 0 1px rgba(117, 241, 255, 0.62),
    0 0 0 3px rgba(117, 241, 255, 0.12);
}

.right-panel :deep(.el-input.is-disabled .el-input__wrapper) {
  background: rgba(7, 20, 48, 0.56);
  box-shadow: inset 0 0 0 1px rgba(117, 241, 255, 0.2);
}

.right-panel :deep(.el-input__inner) {
  color: var(--cyber-text);
}

.action-row {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  min-width: 132px;
  min-height: 42px;
  border: 1px solid rgba(117, 241, 255, 0.64);
  border-radius: 10px;
  padding: 0 18px !important;
  background: linear-gradient(135deg, rgba(0, 214, 255, 0.2), rgba(255, 0, 153, 0.16));
  color: var(--cyber-cyan);
  box-shadow: inset 0 0 12px rgba(117, 241, 255, 0.34);
}

.save-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.46),
    0 0 12px rgba(117, 241, 255, 0.28);
}

@media (max-width: 860px) {
  .center-container {
    grid-template-columns: 1fr;
  }

  .profile-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

@media (max-width: 640px) {
  .center-page {
    min-height: calc(100vh - var(--app-nav-height-mobile));
    padding-top: 20px;
  }
}
</style>
