<template>
  <main class="center-page">
    <div class="cyber-grid-layer" />
    <div class="center-container">
      <aside class="left-panel">
        <h2>用户中心</h2>
        <nav class="center-nav" aria-label="用户中心目录">
          <button
            v-for="section in centerSections"
            :key="section.id"
            type="button"
            class="center-nav-item"
            :class="{
              'is-active': activeSectionId === section.id,
              'is-danger': section.tone === 'danger',
            }"
            :data-testid="`center-nav-${section.id}`"
            @click="handleNavClick(section.id)"
          >
            <span class="center-nav-item__eyebrow">{{ section.eyebrow }}</span>
            <span class="center-nav-item__label">{{ section.label }}</span>
          </button>
        </nav>
      </aside>

      <section class="right-panel">
        <section
          :id="SectionId.UserInfo"
          :ref="(el) => setSectionRef(SectionId.UserInfo, el)"
          class="center-section"
          data-testid="center-section-user-info"
        >
          <header class="center-section__header">
            <p class="center-section__eyebrow">PROFILE CORE</p>
            <h3 class="section-title">用户信息</h3>
          </header>
          <div class="profile-row">
            <span class="label">用户头像</span>
            <button type="button" class="avatar-trigger" @click="openAvatarDialog">
              <el-avatar class="avatar" :size="66" :src="avatarImageUrl || undefined">
                {{ avatarText }}
              </el-avatar>
              <span class="avatar-tip">点我上传头像</span>
            </button>
          </div>
          <div class="profile-row">
            <span class="label">注册邮箱</span>
            <el-input v-model="form.email" disabled />
          </div>
          <div class="profile-row">
            <span class="label">用户昵称</span>
            <el-input v-model="form.nickname" :disabled="!isEditing" />
          </div>
        </section>

        <section
          :id="SectionId.Contact"
          :ref="(el) => setSectionRef(SectionId.Contact, el)"
          class="center-section"
          data-testid="center-section-contact"
        >
          <header class="center-section__header">
            <p class="center-section__eyebrow">CONTACT LINKS</p>
            <h3 class="section-title">联系方式</h3>
          </header>
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
        </section>

        <section
          :id="SectionId.City"
          :ref="(el) => setSectionRef(SectionId.City, el)"
          class="center-section"
          data-testid="center-section-city"
        >
          <header class="center-section__header">
            <p class="center-section__eyebrow">CITY ANCHOR GRID</p>
            <h3 class="section-title">城市管理</h3>
          </header>
          <div class="profile-row">
            <span class="label">当前默认城市</span>
            <el-input
              v-model="defaultCityName"
              placeholder="请输入城市名称"
              :disabled="isUpdatingDefaultCity"
              @change="commitDefaultCity"
              @blur="commitDefaultCity"
            />
          </div>
          <section class="saved-city-panel">
            <div v-if="savedCities.length === 0" class="saved-city-empty">暂无已保存城市</div>
            <div v-else class="saved-city-list">
              <CityListItem
                v-for="(city, index) in savedCities"
                :key="city.cityName"
                :city-name="city.cityName"
                :weather-text="city.weatherText"
                :temperature="city.temperature"
                :is-default="index === 0"
              />
            </div>
          </section>
        </section>

        <section
          :id="SectionId.Danger"
          :ref="(el) => setSectionRef(SectionId.Danger, el)"
          class="center-section center-section--danger"
          data-testid="center-section-danger"
        >
          <header class="center-section__header">
            <p class="center-section__eyebrow center-section__eyebrow--danger">DANGER ACCESS</p>
            <h3 class="section-title section-title--danger">危险操作</h3>
            <p class="danger-note">高风险指令区将影响账号安全与数据归档，请谨慎执行。</p>
          </header>
          <div class="danger-grid">
            <article class="danger-card" data-testid="center-danger-change-password">
              <div class="danger-card__copy">
                <p class="danger-card__eyebrow">AUTH REKEY</p>
                <h4>修改密码</h4>
                <p>验证当前密码后，重新写入新的访问密钥，提升账号防护等级。</p>
              </div>
              <button type="button" class="danger-btn" @click="openPasswordDialog">
                修改密码
              </button>
            </article>
            <article class="danger-card danger-card--critical" data-testid="center-danger-destroy-account">
              <div class="danger-card__copy">
                <p class="danger-card__eyebrow">ACCOUNT PURGE</p>
                <h4>注销账号</h4>
                <p>销毁账号后，所有关联用户数据将永久清除，且无法恢复。</p>
              </div>
              <button type="button" class="danger-btn danger-btn--critical" @click="openDestroyDialog">
                注销账号
              </button>
            </article>
          </div>
        </section>

        <div class="action-row">
          <el-button class="save-btn" :loading="isSubmitting" @click="handleActionClick">
            {{ actionText }}
          </el-button>
        </div>
      </section>
    </div>

    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="460px"
      class="avatar-cyber-dialog account-cyber-dialog"
      :autofocus="false"
      :close-on-click-modal="false"
      @closed="handlePasswordDialogClosed"
    >
      <div class="account-dialog-panel">
        <div class="account-dialog-copy">
          <p class="avatar-dialog-text">请先输入当前密码，再输入新的访问密钥。</p>
          <p class="avatar-dialog-subtext">新密码右侧将实时反馈强度评级，帮助你完成更稳妥的安全升级。</p>
        </div>
        <div class="account-form-grid">
            <label class="account-field">
              <span class="account-field__label">当前密码</span>
              <el-input
                class="account-password-input"
                v-model="passwordForm.currentPassword"
                type="password"
                show-password
                placeholder="请输入当前密码"
              />
          </label>
            <label class="account-field">
              <span class="account-field__label">新密码</span>
              <div class="password-strength-row">
                <el-input
                  class="account-password-input"
                  v-model="passwordForm.newPassword"
                  type="password"
                  show-password
                  placeholder="请输入新密码"
                />
                <div
                  class="password-strength-meter"
                  :class="`is-${passwordStrength.level}`"
                  data-testid="password-strength-indicator"
                >
                  <div class="password-strength-meter__bars" aria-hidden="true">
                    <span class="password-strength-meter__bar" />
                    <span class="password-strength-meter__bar" />
                    <span class="password-strength-meter__bar" />
                  </div>
                  <span class="password-strength-meter__label">{{ passwordStrength.label }}</span>
                </div>
              </div>
            </label>
        </div>
        <div class="account-dialog-actions">
          <el-button
            class="avatar-dialog-btn avatar-dialog-primary account-dialog-confirm"
            :loading="isChangingPassword"
            @click="submitChangePassword"
          >
            <span class="avatar-dialog-btn__frame" aria-hidden="true" />
            <span class="avatar-dialog-btn__scanline" aria-hidden="true" />
            <span class="avatar-dialog-btn__label">确认修改</span>
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="destroyDialogVisible"
      title="注销账号"
      width="460px"
      class="avatar-cyber-dialog account-cyber-dialog account-cyber-dialog--danger"
      :autofocus="false"
      :close-on-click-modal="false"
      @closed="handleDestroyDialogClosed"
    >
      <div class="account-dialog-panel account-dialog-panel--danger">
        <div class="account-dialog-copy">
          <p class="destroy-warning-text">销毁账号后，所有数据均将销毁，且无法恢复！是否确认进行？</p>
        </div>
        <div class="account-dialog-actions account-dialog-actions--split">
          <el-button
            class="avatar-dialog-btn avatar-dialog-primary account-dialog-critical"
            :loading="isDestroyingAccount"
            @click="submitDestroyAccount"
          >
            <span class="avatar-dialog-btn__frame" aria-hidden="true" />
            <span class="avatar-dialog-btn__scanline" aria-hidden="true" />
            <span class="avatar-dialog-btn__label">确认销毁</span>
          </el-button>
          <el-button class="avatar-dialog-btn avatar-dialog-secondary" @click="destroyDialogVisible = false">
            <span class="avatar-dialog-btn__frame" aria-hidden="true" />
            <span class="avatar-dialog-btn__scanline" aria-hidden="true" />
            <span class="avatar-dialog-btn__label">取消</span>
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="avatarDialogVisible"
      title="上传头像"
      width="420px"
      class="avatar-cyber-dialog"
      :autofocus="false"
      :close-on-click-modal="false"
      @closed="handleAvatarDialogClosed"
    >
      <div class="avatar-dialog-panel">
        <div class="avatar-dialog-copy">
          <p class="avatar-dialog-text">支持 jpg / png / webp，大小不超过 2MB。</p>
          <p class="avatar-dialog-subtext">霓虹上传舱已就绪，点击中间区域即可选择头像。</p>
        </div>
        <button
          type="button"
          class="avatar-upload-zone"
          :class="{
            'is-selected': !!selectedAvatarFile,
            'is-uploading': isUploadingAvatar,
          }"
          :disabled="isUploadingAvatar"
          @click="triggerSelectAvatar"
          @keydown="handleUploadZoneKeydown"
        >
          <span class="avatar-upload-zone__frame" aria-hidden="true" />
          <span class="avatar-upload-zone__scanline" aria-hidden="true" />
          <span class="avatar-upload-zone__eyebrow">Avatar Uplink</span>
          <span class="avatar-upload-zone__title">{{ avatarUploadZoneTitle }}</span>
          <span class="avatar-upload-zone__desc">{{ avatarUploadZoneDescription }}</span>
        </button>
        <input
          ref="avatarInputRef"
          class="hidden-avatar-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="handleAvatarFileChange"
        />
        <div class="avatar-preview-card" v-if="avatarPreviewUrl">
          <div class="avatar-preview-meta">
            <span class="avatar-preview-label">实时预览</span>
            <span class="avatar-preview-hint">{{
              selectedAvatarFile ? '已装载待上传文件' : '当前正在使用的头像'
            }}</span>
          </div>
          <img class="avatar-preview" :src="avatarPreviewUrl" alt="头像预览" />
        </div>
        <div class="avatar-dialog-actions">
          <el-button
            ref="selectAvatarButtonRef"
            class="avatar-dialog-btn avatar-dialog-secondary"
            :disabled="isUploadingAvatar"
            @click="triggerSelectAvatar"
          >
            <span class="avatar-dialog-btn__frame" aria-hidden="true" />
            <span class="avatar-dialog-btn__scanline" aria-hidden="true" />
            <span class="avatar-dialog-btn__label">重新选择</span>
          </el-button>
          <el-button
            class="avatar-dialog-btn avatar-dialog-primary"
            type="primary"
            :loading="isUploadingAvatar"
            :disabled="isUploadingAvatar"
            @click="handleAvatarUpload"
          >
            <span class="avatar-dialog-btn__frame" aria-hidden="true" />
            <span class="avatar-dialog-btn__scanline" aria-hidden="true" />
            <span class="avatar-dialog-btn__label">上传头像</span>
          </el-button>
        </div>
        <p class="avatar-dialog-footnote">上传后会同步更新用户中心与导航栏头像显示。</p>
      </div>
    </el-dialog>

    <el-dialog
      v-model="cropDialogVisible"
      title="裁剪头像"
      width="560px"
      class="avatar-cyber-dialog avatar-crop-dialog"
      :autofocus="false"
      :close-on-click-modal="false"
      @closed="handleCropDialogClosed"
    >
      <div class="avatar-crop-panel">
        <div class="avatar-dialog-copy">
          <p class="avatar-dialog-text">支持上下左右拖拽调整头像视口，圆形区域可移动到图像外侧。</p>
          <p class="avatar-dialog-subtext">可在底部自定义缩放大小，最小为 100%，确认后会生成新的头像文件。</p>
        </div>
        <div class="avatar-crop-stage" @mousedown="handleCropDragStart">
          <img
            v-if="cropImageUrl"
            class="avatar-crop-image"
            :src="cropImageUrl"
            :style="cropImageStyle"
            alt="待裁剪头像"
            draggable="false"
          />
          <div class="avatar-crop-overlay" aria-hidden="true">
            <div class="avatar-crop-circle">
              <div class="avatar-crop-reticle" />
            </div>
          </div>
        </div>
        <div v-if="cropImageUrl" class="avatar-crop-live-preview">
          <div class="avatar-crop-live-preview__meta">
            <span class="avatar-preview-label">实时预览</span>
            <span class="avatar-preview-hint">预览与圆形视口保持同步</span>
          </div>
          <div class="avatar-crop-live-preview__frame">
            <img
              class="avatar-crop-live-preview__image"
              :src="cropImageUrl"
              :style="cropPreviewImageStyle"
              alt="头像实时预览"
              draggable="false"
            />
          </div>
        </div>
        <div class="avatar-crop-toolbar">
          <button type="button" class="avatar-dialog-btn avatar-dialog-secondary" @click="zoomOutCrop">
            <span class="avatar-dialog-btn__frame" aria-hidden="true" />
            <span class="avatar-dialog-btn__scanline" aria-hidden="true" />
            <span class="avatar-dialog-btn__label">缩小</span>
          </button>
          <span class="avatar-crop-scale-label">{{ cropScaleLabel }}</span>
          <button type="button" class="avatar-dialog-btn avatar-dialog-primary" @click="zoomInCrop">
            <span class="avatar-dialog-btn__frame" aria-hidden="true" />
            <span class="avatar-dialog-btn__scanline" aria-hidden="true" />
            <span class="avatar-dialog-btn__label">放大</span>
          </button>
        </div>
        <div class="avatar-crop-slider">
          <span class="avatar-crop-slider__label">缩放大小</span>
          <input
            v-model="cropScalePercent"
            class="avatar-crop-slider__input"
            type="range"
            min="100"
            :max="CROP_MAX_PERCENT"
            step="1"
          />
          <span class="avatar-crop-slider__value">{{ cropScaleLabel }}</span>
        </div>
        <div class="avatar-dialog-actions avatar-crop-actions">
          <button type="button" class="avatar-dialog-btn avatar-dialog-secondary" @click="cancelCropDialog">
            <span class="avatar-dialog-btn__frame" aria-hidden="true" />
            <span class="avatar-dialog-btn__scanline" aria-hidden="true" />
            <span class="avatar-dialog-btn__label">取消裁剪</span>
          </button>
          <button type="button" class="avatar-dialog-btn avatar-dialog-primary" @click="confirmCropSelection">
            <span class="avatar-dialog-btn__frame" aria-hidden="true" />
            <span class="avatar-dialog-btn__scanline" aria-hidden="true" />
            <span class="avatar-dialog-btn__label">确认裁剪</span>
          </button>
        </div>
      </div>
    </el-dialog>
    <canvas ref="cropCanvasRef" class="hidden-crop-canvas" />
  </main>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useRouter } from 'vue-router'
import CityListItem from '@/components/city-list/CityListItem.vue'
import { changePassword, destroyAccount, getProfile, updateProfile, uploadAvatar } from '@/service/auth'
import { getCityList } from '@/service/city'
import { useAuthStore } from '@/store/auth'
import { useCityStore } from '@/store/city'

type ProfileForm = {
  email: string
  nickname: string
  phone: string
  qq: string
  wechat: string
  avatarUrl: string
}

enum SectionId {
  UserInfo = 'user-info',
  Contact = 'contact-info',
  City = 'city-management',
  Danger = 'danger-zone',
}

type PasswordStrengthLevel = 'empty' | 'low' | 'medium' | 'high'

const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const CROP_VIEWPORT_SIZE = 260
const CROP_RESULT_SIZE = 256
const CROP_SCALE_STEP = 0.2
const CROP_MAX_SCALE = 3
const CROP_MAX_PERCENT = CROP_MAX_SCALE * 100
const CROP_PREVIEW_SIZE = 112

const router = useRouter()
const authStore = useAuthStore()
const cityStore = useCityStore()
const centerSections = [
  { id: SectionId.UserInfo, label: '用户信息', eyebrow: '01', tone: 'default' },
  { id: SectionId.Contact, label: '联系方式', eyebrow: '02', tone: 'default' },
  { id: SectionId.City, label: '城市管理', eyebrow: '03', tone: 'default' },
  { id: SectionId.Danger, label: '危险操作', eyebrow: '04', tone: 'danger' },
] as const
const isEditing = ref(false)
const isSubmitting = ref(false)
const passwordDialogVisible = ref(false)
const destroyDialogVisible = ref(false)
const isChangingPassword = ref(false)
const isDestroyingAccount = ref(false)
const avatarDialogVisible = ref(false)
const cropDialogVisible = ref(false)
const isUploadingAvatar = ref(false)
const isUpdatingDefaultCity = ref(false)
const activeSectionId = ref<SectionId>(SectionId.UserInfo)
const sectionRefs = new Map<SectionId, HTMLElement>()
const selectedAvatarFile = ref<File | null>(null)
const avatarPreviewUrl = ref('')
const defaultCityName = ref('')
const avatarInputRef = ref<HTMLInputElement | null>(null)
const selectAvatarButtonRef = ref<{ $el?: HTMLElement } | null>(null)
const cropCanvasRef = ref<HTMLCanvasElement | null>(null)
const cropSourceFile = ref<File | null>(null)
const cropImageUrl = ref('')
const cropScale = ref(1)
const cropMinScale = ref(1)
const cropOffset = reactive({ x: 0, y: 0 })
const cropImageNatural = reactive({ width: 0, height: 0 })
const cropDragState = reactive({
  active: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
})
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
})
const form = reactive<ProfileForm>({
  email: '',
  nickname: '',
  phone: '',
  qq: '',
  wechat: '',
  avatarUrl: '',
})
const originalForm = reactive<Omit<ProfileForm, 'email'>>({
  nickname: '',
  phone: '',
  qq: '',
  wechat: '',
  avatarUrl: '',
})

const avatarImageUrl = computed(() => form.avatarUrl)
const avatarText = computed(() => (form.nickname || form.email || 'U').slice(0, 1).toUpperCase())
const avatarUploadZoneTitle = computed(() => {
  if (isUploadingAvatar.value) return '正在上传头像'
  if (selectedAvatarFile.value) return '点我重新选择头像'
  return '点我上传头像'
})
const avatarUploadZoneDescription = computed(() => {
  if (isUploadingAvatar.value) return '赛博传输链路开启中，请稍候...'
  if (selectedAvatarFile.value) return `已选择 ${selectedAvatarFile.value.name}`
  return '点击此区域，弹出系统文件选择框'
})
const cropScaleLabel = computed(() => `${Math.round(cropScale.value * 100)}%`)
const cropScalePercent = computed({
  get: () => String(Math.round(cropScale.value * 100)),
  set: (value: string) => {
    const nextPercent = Number(value)
    if (Number.isNaN(nextPercent)) {
      return
    }
    cropScale.value = Math.min(CROP_MAX_SCALE, Math.max(cropMinScale.value, nextPercent / 100))
  },
})
const hasChanges = computed(
  () =>
    isEditing.value &&
    (form.nickname !== originalForm.nickname ||
      form.phone !== originalForm.phone ||
      form.qq !== originalForm.qq ||
      form.wechat !== originalForm.wechat),
)
const actionText = computed(() => (hasChanges.value ? '保存信息' : '修改信息'))
const savedCities = computed(() => cityStore.cities)
const passwordStrength = computed<{ level: PasswordStrengthLevel; label: '低' | '中' | '高' | '--' }>(() => {
  const value = passwordForm.newPassword.trim()
  if (!value) {
    return { level: 'empty', label: '--' }
  }

  const kinds = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length

  if (value.length >= 10 && kinds >= 3) {
    return { level: 'high', label: '高' }
  }

  if (value.length >= 8 && kinds >= 2) {
    return { level: 'medium', label: '中' }
  }

  return { level: 'low', label: '低' }
})
const cropImageStyle = computed(() => {
  const { width, height, offsetX, offsetY } = getCropViewportMetrics(cropScale.value)
  return {
    width: `${width}px`,
    height: `${height}px`,
    transform: `translate(${offsetX}px, ${offsetY}px)`,
  }
})
const cropPreviewImageStyle = computed(() => {
  const { width, height, offsetX, offsetY } = getCropViewportMetrics(cropScale.value)
  const ratio = CROP_PREVIEW_SIZE / CROP_VIEWPORT_SIZE
  return {
    width: `${width * ratio}px`,
    height: `${height * ratio}px`,
    transform: `translate(${offsetX * ratio}px, ${offsetY * ratio}px)`,
  }
})

const focusAvatarDialogAction = () => {
  queueMicrotask(() => {
    const buttonElement =
      selectAvatarButtonRef.value?.$el instanceof HTMLElement
        ? selectAvatarButtonRef.value.$el
        : null
    buttonElement?.focus?.()
  })
}

let sectionObserver: IntersectionObserver | null = null

const setSectionRef = (
  id: SectionId,
  element: Element | ComponentPublicInstance | null,
) => {
  if (element instanceof HTMLElement) {
    sectionRefs.set(id, element)
    return
  }
  sectionRefs.delete(id)
}

const handleNavClick = (id: SectionId) => {
  activeSectionId.value = id
  sectionRefs.get(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

const setupSectionObserver = () => {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return
  }

  sectionObserver?.disconnect()
  sectionObserver = new IntersectionObserver(
    (entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

      const nextId = activeEntry?.target.getAttribute('id') as SectionId | null
      if (nextId) {
        activeSectionId.value = nextId
      }
    },
    {
      threshold: [0.2, 0.45, 0.7],
      rootMargin: '-18% 0px -42% 0px',
    },
  )

  for (const element of sectionRefs.values()) {
    sectionObserver.observe(element)
  }
}

const resetPasswordDialog = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
}

const openPasswordDialog = () => {
  resetPasswordDialog()
  passwordDialogVisible.value = true
}

const handlePasswordDialogClosed = () => {
  resetPasswordDialog()
}

const openDestroyDialog = () => {
  destroyDialogVisible.value = true
}

const handleDestroyDialogClosed = () => {
  destroyDialogVisible.value = false
}

const releaseBlobPreviewIfNeeded = () => {
  if (avatarPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }
}

const releaseCropImageIfNeeded = () => {
  if (cropImageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(cropImageUrl.value)
  }
}

const resetCropDragState = () => {
  cropDragState.active = false
  cropDragState.startX = 0
  cropDragState.startY = 0
  cropDragState.originX = 0
  cropDragState.originY = 0
}

const resetCropDialogState = () => {
  releaseCropImageIfNeeded()
  cropDialogVisible.value = false
  cropSourceFile.value = null
  cropImageUrl.value = ''
  cropScale.value = 1
  cropMinScale.value = 1
  cropOffset.x = 0
  cropOffset.y = 0
  cropImageNatural.width = 0
  cropImageNatural.height = 0
  resetCropDragState()
  if (avatarInputRef.value) {
    avatarInputRef.value.value = ''
  }
}

const resetAvatarDialog = () => {
  releaseBlobPreviewIfNeeded()
  selectedAvatarFile.value = null
  avatarPreviewUrl.value = form.avatarUrl
  if (avatarInputRef.value) {
    avatarInputRef.value.value = ''
  }
}

const openAvatarDialog = () => {
  resetCropDialogState()
  resetAvatarDialog()
  queueMicrotask(() => {
    avatarDialogVisible.value = true
  })
}

const handleAvatarDialogClosed = () => {
  resetCropDialogState()
  resetAvatarDialog()
}

const triggerSelectAvatar = () => {
  avatarInputRef.value?.click()
}

const handleUploadZoneKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }
  event.preventDefault()
  triggerSelectAvatar()
}

const getCropBaseScale = () => {
  if (!cropImageNatural.width || !cropImageNatural.height) {
    return 1
  }
  return Math.max(
    CROP_VIEWPORT_SIZE / cropImageNatural.width,
    CROP_VIEWPORT_SIZE / cropImageNatural.height,
  )
}

const getCropRenderedSize = (scale: number) => {
  const baseScale = getCropBaseScale() * scale
  return {
    width: cropImageNatural.width * baseScale,
    height: cropImageNatural.height * baseScale,
  }
}

const getCropViewportMetrics = (scale: number) => {
  const { width, height } = getCropRenderedSize(scale)
  return {
    width,
    height,
    offsetX: (CROP_VIEWPORT_SIZE - width) / 2 + cropOffset.x,
    offsetY: (CROP_VIEWPORT_SIZE - height) / 2 + cropOffset.y,
  }
}

const clampCropOffset = (nextX: number, nextY: number, scale = cropScale.value) => {
  return {
    x: nextX,
    y: nextY,
  }
}

const applyCropOffset = (nextX: number, nextY: number, scale = cropScale.value) => {
  const clamped = clampCropOffset(nextX, nextY, scale)
  cropOffset.x = clamped.x
  cropOffset.y = clamped.y
}

const loadImageMeta = (file: File) =>
  new Promise<{ url: string; width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      resolve({
        url: objectUrl,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      })
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('头像图片加载失败，请重新选择'))
    }
    image.src = objectUrl
  })

const openCropDialog = (file: File, imageMeta: { url: string; width: number; height: number }) => {
  resetCropDragState()
  releaseCropImageIfNeeded()
  cropSourceFile.value = file
  cropImageUrl.value = imageMeta.url
  cropImageNatural.width = imageMeta.width
  cropImageNatural.height = imageMeta.height
  const nextMinScale = 1
  cropScale.value = nextMinScale
  cropMinScale.value = nextMinScale
  cropOffset.x = 0
  cropOffset.y = 0
  applyCropOffset(0, 0, nextMinScale)
  cropDialogVisible.value = true
}

const handleAvatarFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    ElMessage.warning('仅支持 jpg/png/webp 格式图片')
    input.value = ''
    selectedAvatarFile.value = null
    return
  }
  if (file.size > MAX_AVATAR_SIZE) {
    ElMessage.warning('头像文件不能超过 2MB')
    input.value = ''
    selectedAvatarFile.value = null
    return
  }

  try {
    const imageMeta = await loadImageMeta(file)
    openCropDialog(file, imageMeta)
  } catch (error) {
    input.value = ''
    const message = error instanceof Error ? error.message : '头像图片加载失败，请重新选择'
    ElMessage.error(message)
  }
}

const adjustCropScale = (delta: number) => {
  const nextScale = Math.min(
    CROP_MAX_SCALE,
    Math.max(cropMinScale.value, Number((cropScale.value + delta).toFixed(2))),
  )
  cropScale.value = nextScale
  applyCropOffset(cropOffset.x, cropOffset.y, nextScale)
}

const zoomInCrop = () => {
  adjustCropScale(CROP_SCALE_STEP)
}

const zoomOutCrop = () => {
  adjustCropScale(-CROP_SCALE_STEP)
}

const handleCropDragMove = (event: MouseEvent) => {
  if (!cropDragState.active) {
    return
  }
  const nextX = cropDragState.originX + (event.clientX - cropDragState.startX)
  const nextY = cropDragState.originY + (event.clientY - cropDragState.startY)
  applyCropOffset(nextX, nextY)
}

const stopCropDrag = () => {
  resetCropDragState()
  window.removeEventListener('mousemove', handleCropDragMove)
  window.removeEventListener('mouseup', stopCropDrag)
}

const handleCropDragStart = (event: MouseEvent) => {
  if (!cropImageUrl.value) {
    return
  }
  cropDragState.active = true
  cropDragState.startX = event.clientX
  cropDragState.startY = event.clientY
  cropDragState.originX = cropOffset.x
  cropDragState.originY = cropOffset.y
  window.addEventListener('mousemove', handleCropDragMove)
  window.addEventListener('mouseup', stopCropDrag)
}

const loadCanvasImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('裁剪图片加载失败，请重新选择'))
    image.src = url
  })

const canvasToBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type)
  })

const handleCropDialogClosed = () => {
  stopCropDrag()
  resetCropDialogState()
}

const cancelCropDialog = () => {
  cropDialogVisible.value = false
}

const confirmCropSelection = async () => {
  if (!cropSourceFile.value || !cropImageUrl.value) {
    ElMessage.warning('请先选择头像文件')
    return
  }

  try {
    const image = await loadCanvasImage(cropImageUrl.value)
    const canvas = cropCanvasRef.value ?? document.createElement('canvas')
    canvas.width = CROP_RESULT_SIZE
    canvas.height = CROP_RESULT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      ElMessage.error('头像裁剪初始化失败，请稍后重试')
      return
    }

    const { width, height, offsetX, offsetY } = getCropViewportMetrics(cropScale.value)
    const ratio = CROP_RESULT_SIZE / CROP_VIEWPORT_SIZE
    const drawWidth = width * ratio
    const drawHeight = height * ratio
    const drawX = offsetX * ratio
    const drawY = offsetY * ratio

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.beginPath()
    ctx.arc(CROP_RESULT_SIZE / 2, CROP_RESULT_SIZE / 2, CROP_RESULT_SIZE / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
    ctx.restore()

    const blob = await canvasToBlob(canvas, 'image/png')
    if (!blob) {
      ElMessage.error('头像裁剪失败，请重新尝试')
      return
    }

    const croppedFile = new File(
      [blob],
      `${cropSourceFile.value.name.replace(/\.[^.]+$/, '') || 'avatar'}-cropped.png`,
      { type: 'image/png' },
    )

    selectedAvatarFile.value = croppedFile
    releaseBlobPreviewIfNeeded()
    avatarPreviewUrl.value = URL.createObjectURL(croppedFile)
    cropDialogVisible.value = false
  } catch (error) {
    const message = error instanceof Error ? error.message : '头像裁剪失败，请重新尝试'
    ElMessage.error(message)
  }
}

const handleAvatarUpload = async () => {
  if (!selectedAvatarFile.value) {
    ElMessage.warning('请先选择头像文件')
    return
  }
  if (isUploadingAvatar.value) {
    return
  }

  const oldAvatarUrl = form.avatarUrl
  try {
    isUploadingAvatar.value = true
    const uploadRes = await uploadAvatar(selectedAvatarFile.value)
    const nextAvatarUrl = uploadRes.data.avatarUrl
    form.avatarUrl = nextAvatarUrl
    avatarPreviewUrl.value = nextAvatarUrl

    await updateProfile({ avatarUrl: nextAvatarUrl })
    originalForm.avatarUrl = nextAvatarUrl
    authStore.updateUserProfile({
      avatarUrl: nextAvatarUrl,
      nickname: form.nickname,
      email: form.email,
    })
    avatarDialogVisible.value = false
    ElMessage.success(uploadRes.message || '头像上传成功')
  } catch (error) {
    form.avatarUrl = oldAvatarUrl
    avatarPreviewUrl.value = oldAvatarUrl
    const message = error instanceof Error ? error.message : '头像上传失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    isUploadingAvatar.value = false
  }
}

const submitChangePassword = async () => {
  const currentPassword = passwordForm.currentPassword.trim()
  const newPassword = passwordForm.newPassword.trim()

  if (!currentPassword || !newPassword) {
    ElMessage.warning('请完整输入当前密码和新密码')
    return
  }

  if (currentPassword === newPassword) {
    ElMessage.warning('新密码不能与当前密码相同')
    return
  }

  if (isChangingPassword.value) {
    return
  }

  try {
    isChangingPassword.value = true
    const res = await changePassword({
      currentPassword,
      newPassword,
    })
    passwordDialogVisible.value = false
    resetPasswordDialog()
    ElMessage.success(res.message || '密码修改成功')
  } catch (error) {
    const message = error instanceof Error ? error.message : '密码修改失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    isChangingPassword.value = false
  }
}

const submitDestroyAccount = async () => {
  if (isDestroyingAccount.value) {
    return
  }

  const currentUserId = authStore.user?.userId || ''

  try {
    isDestroyingAccount.value = true
    const res = await destroyAccount()
    if (currentUserId) {
      cityStore.clearPersistedCitiesForUser(currentUserId)
    }
    cityStore.clearCities()
    authStore.clearAuth()
    destroyDialogVisible.value = false
    ElMessage.success(res.message || '账号已注销')
    await router.push('/login')
  } catch (error) {
    const message = error instanceof Error ? error.message : '注销账号失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    isDestroyingAccount.value = false
  }
}

defineExpose({
  __testGetActiveSectionId() {
    return activeSectionId.value
  },
  __testSetActiveSectionId(id: SectionId) {
    activeSectionId.value = id
  },
  __testSetAvatarFile(file: File) {
    selectedAvatarFile.value = file
    releaseBlobPreviewIfNeeded()
    avatarPreviewUrl.value = URL.createObjectURL(file)
  },
  __testOpenCropDialog(file: File, meta?: { width: number; height: number }) {
    openCropDialog(file, {
      url: 'blob:test-crop-source',
      width: meta?.width ?? 360,
      height: meta?.height ?? 360,
    })
  },
  __testApplyCroppedAvatar(file: File) {
    selectedAvatarFile.value = file
    releaseBlobPreviewIfNeeded()
    avatarPreviewUrl.value = URL.createObjectURL(file)
    cropDialogVisible.value = false
  },
  __testGetCropMetrics() {
    return {
      cropMinScale: cropMinScale.value,
      cropScale: cropScale.value,
      cropOffsetX: cropOffset.x,
      cropOffsetY: cropOffset.y,
    }
  },
  __testGetCropPreviewSyncMetrics() {
    const viewport = getCropViewportMetrics(cropScale.value)
    const ratio = CROP_PREVIEW_SIZE / CROP_VIEWPORT_SIZE
    return {
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      viewportOffsetX: viewport.offsetX,
      viewportOffsetY: viewport.offsetY,
      previewWidth: viewport.width * ratio,
      previewHeight: viewport.height * ratio,
      previewOffsetX: viewport.offsetX * ratio,
      previewOffsetY: viewport.offsetY * ratio,
      ratio,
    }
  },
  __testSetCropOffset(x: number, y: number) {
    applyCropOffset(x, y)
  },
})

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
    form.avatarUrl = res.data.avatarUrl || ''

    originalForm.nickname = form.nickname
    originalForm.phone = form.phone
    originalForm.qq = form.qq
    originalForm.wechat = form.wechat
    originalForm.avatarUrl = form.avatarUrl
    avatarPreviewUrl.value = form.avatarUrl
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
    form.avatarUrl = res.data.avatarUrl || form.avatarUrl

    originalForm.nickname = form.nickname
    originalForm.phone = form.phone
    originalForm.qq = form.qq
    originalForm.wechat = form.wechat
    originalForm.avatarUrl = form.avatarUrl
    authStore.updateUserProfile({
      email: form.email,
      nickname: form.nickname,
      phone: form.phone,
      qq: form.qq,
      wechat: form.wechat,
      avatarUrl: form.avatarUrl,
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

const syncDefaultCityName = () => {
  defaultCityName.value = cityStore.cities[0]?.cityName || ''
}

const commitDefaultCity = async () => {
  if (isUpdatingDefaultCity.value) {
    return
  }

  const nextCityName = defaultCityName.value.trim()
  const currentDefaultCity = cityStore.cities[0]?.cityName || ''

  if (!nextCityName) {
    defaultCityName.value = currentDefaultCity
    ElMessage.warning('默认城市不能为空')
    return
  }

  if (nextCityName === currentDefaultCity) {
    defaultCityName.value = nextCityName
    return
  }

  const currentCities = [...cityStore.cities]
  const existedIndex = currentCities.findIndex((city) => city.cityName === nextCityName)
  if (existedIndex >= 0) {
    const [targetCity] = currentCities.splice(existedIndex, 1)
    if (!targetCity) {
      defaultCityName.value = currentDefaultCity
      return
    }
    cityStore.setCities([targetCity, ...currentCities])
    ElMessage.success('默认城市已更新')
    return
  }

  isUpdatingDefaultCity.value = true
  try {
    const response = await getCityList(nextCityName)
    const matchedCity =
      response.data.find((city) => city.cityName === nextCityName) ?? response.data[0] ?? null

    if (!matchedCity) {
      defaultCityName.value = currentDefaultCity
      ElMessage.error('未找到该城市，请检查名称后重试')
      return
    }

    const dedupedCities = cityStore.cities.filter((city) => city.cityName !== matchedCity.cityName)
    cityStore.setCities([matchedCity, ...dedupedCities])
    ElMessage.success('默认城市已更新')
  } catch {
    defaultCityName.value = currentDefaultCity
    ElMessage.error('获取数据失败，请稍后重试')
  } finally {
    isUpdatingDefaultCity.value = false
  }
}

onMounted(() => {
  if (cityStore.cities.length === 0) {
    cityStore.syncFromStorage()
  }
  syncDefaultCityName()
  loadProfile()
  nextTick(() => {
    setupSectionObserver()
  })
})

watch(
  () => cityStore.cities,
  () => {
    if (!isUpdatingDefaultCity.value) {
      syncDefaultCityName()
    }
  },
  { deep: true },
)

watch(avatarDialogVisible, (visible) => {
  if (visible) {
    focusAvatarDialogAction()
  }
})

onUnmounted(() => {
  stopCropDrag()
  sectionObserver?.disconnect()
  releaseCropImageIfNeeded()
  releaseBlobPreviewIfNeeded()
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

.center-nav {
  margin-top: 14px;
  display: grid;
  gap: 8px;
}

.center-nav-item {
  margin: 0;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(117, 241, 255, 0.2);
  color: var(--cyber-text-muted);
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, rgba(4, 18, 40, 0.65), rgba(4, 12, 30, 0.55));
  box-shadow: inset 0 0 12px rgba(117, 241, 255, 0.08);
  display: grid;
  gap: 4px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--cyber-ease),
    transform var(--cyber-ease),
    box-shadow var(--cyber-ease),
    color var(--cyber-ease),
    background var(--cyber-ease);
}

.center-nav-item:hover,
.center-nav-item:focus-visible {
  transform: translateY(-1px);
  border-color: rgba(117, 241, 255, 0.44);
  color: #effcff;
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.12),
    0 0 16px rgba(117, 241, 255, 0.16);
  outline: none;
}

.center-nav-item.is-active {
  border-color: rgba(117, 241, 255, 0.72);
  color: #f4feff;
  background:
    linear-gradient(135deg, rgba(88, 225, 255, 0.18), rgba(125, 84, 255, 0.12)),
    linear-gradient(135deg, rgba(4, 18, 40, 0.78), rgba(4, 12, 30, 0.68));
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.16),
    0 0 18px rgba(117, 241, 255, 0.18);
}

.center-nav-item.is-danger {
  border-color: rgba(255, 95, 147, 0.28);
  box-shadow: inset 0 0 12px rgba(255, 95, 147, 0.08);
}

.center-nav-item.is-danger.is-active {
  border-color: rgba(255, 125, 172, 0.7);
  background:
    linear-gradient(135deg, rgba(255, 82, 205, 0.18), rgba(255, 118, 118, 0.12)),
    linear-gradient(135deg, rgba(28, 11, 28, 0.8), rgba(18, 8, 22, 0.72));
  box-shadow:
    inset 0 0 16px rgba(255, 82, 205, 0.16),
    0 0 18px rgba(255, 82, 205, 0.18);
}

.center-nav-item__eyebrow {
  font-size: 10px;
  color: rgba(143, 217, 241, 0.62);
  letter-spacing: 0.24em;
}

.center-nav-item__label {
  font-size: 14px;
}

.right-panel {
  padding: 22px 22px 18px;
}

.center-section + .center-section {
  margin-top: 26px;
}

.center-section {
  position: relative;
  scroll-margin-top: 96px;
  padding: 18px 18px 20px;
  border-radius: 18px;
  border: 1px solid rgba(117, 241, 255, 0.12);
  background:
    linear-gradient(135deg, rgba(5, 18, 54, 0.18), rgba(4, 12, 30, 0.08)),
    rgba(3, 12, 28, 0.22);
}

.center-section--danger {
  border-color: rgba(255, 82, 205, 0.22);
  background:
    radial-gradient(circle at top right, rgba(255, 82, 205, 0.12), transparent 36%),
    linear-gradient(135deg, rgba(34, 8, 24, 0.3), rgba(14, 6, 18, 0.22));
}

.center-section__header {
  display: grid;
  gap: 8px;
}

.center-section__eyebrow {
  margin: 0;
  color: rgba(117, 241, 255, 0.72);
  letter-spacing: 0.28em;
  font-size: 11px;
}

.center-section__eyebrow--danger {
  color: rgba(255, 149, 205, 0.78);
}

.section-title {
  margin: 0;
  font-size: 22px;
  color: var(--cyber-cyan);
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.45);
}

.section-title--danger {
  color: #ff9fcb;
  text-shadow: 0 0 8px rgba(255, 82, 205, 0.36);
}

.danger-note {
  margin: 0;
  color: rgba(235, 208, 228, 0.72);
  line-height: 1.7;
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

.avatar-trigger {
  position: relative;
  width: fit-content;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.avatar {
  border: 1px solid rgba(117, 241, 255, 0.55);
  background: rgba(3, 20, 45, 0.75);
  color: var(--cyber-cyan);
  box-shadow: 0 0 12px rgba(117, 241, 255, 0.34);
}

.avatar-tip {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #dcf9ff;
  font-size: 11px;
  background: rgba(3, 10, 24, 0.66);
  opacity: 0;
  transition: opacity var(--cyber-ease);
}

.avatar-trigger:hover .avatar-tip,
.avatar-trigger:focus-visible .avatar-tip {
  opacity: 1;
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

.saved-city-panel {
  margin-top: 14px;
}

.danger-grid {
  margin-top: 18px;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.danger-card {
  position: relative;
  overflow: hidden;
  min-height: 220px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(117, 241, 255, 0.2);
  background:
    radial-gradient(circle at top, rgba(117, 241, 255, 0.12), transparent 38%),
    linear-gradient(155deg, rgba(5, 18, 42, 0.94), rgba(3, 10, 24, 0.96));
  display: grid;
  align-content: space-between;
  gap: 18px;
}

.danger-card--critical {
  border-color: rgba(255, 110, 162, 0.26);
  background:
    radial-gradient(circle at top right, rgba(255, 82, 205, 0.14), transparent 34%),
    linear-gradient(155deg, rgba(34, 8, 24, 0.96), rgba(12, 5, 16, 0.98));
}

.danger-card__copy {
  display: grid;
  gap: 10px;
}

.danger-card__eyebrow {
  margin: 0;
  color: rgba(255, 163, 211, 0.74);
  letter-spacing: 0.24em;
  font-size: 11px;
}

.danger-card h4 {
  margin: 0;
  font-size: 22px;
  color: #f4feff;
}

.danger-card p {
  margin: 0;
  color: rgba(223, 239, 255, 0.72);
  line-height: 1.7;
}

.danger-btn {
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(117, 241, 255, 0.38);
  background:
    linear-gradient(135deg, rgba(0, 214, 255, 0.14), rgba(125, 84, 255, 0.12)),
    rgba(4, 18, 42, 0.82);
  color: #dcf9ff;
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.1),
    0 0 14px rgba(117, 241, 255, 0.08);
  cursor: pointer;
  transition:
    transform var(--cyber-ease),
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    filter var(--cyber-ease);
}

.danger-btn:hover,
.danger-btn:focus-visible {
  transform: translateY(-1px);
  border-color: rgba(117, 241, 255, 0.62);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.16),
    0 0 16px rgba(117, 241, 255, 0.14);
  outline: none;
}

.danger-btn--critical {
  border-color: rgba(255, 119, 165, 0.54);
  background:
    linear-gradient(135deg, rgba(255, 82, 205, 0.2), rgba(255, 110, 110, 0.14)),
    rgba(30, 7, 18, 0.88);
  box-shadow:
    inset 0 0 16px rgba(255, 82, 205, 0.12),
    0 0 16px rgba(255, 82, 205, 0.12);
}

.saved-city-list {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.saved-city-empty {
  padding: 20px 14px;
  text-align: center;
  color: var(--cyber-text-muted);
  border: 1px dashed rgba(117, 241, 255, 0.3);
  border-radius: 12px;
  background: rgba(5, 20, 45, 0.4);
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.35);
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

.account-dialog-panel {
  position: relative;
  overflow: hidden;
  padding: 18px;
  background:
    linear-gradient(180deg, rgba(8, 21, 46, 0.92), rgba(3, 10, 26, 0.96)),
    linear-gradient(135deg, rgba(0, 145, 255, 0.12), rgba(255, 82, 205, 0.08));
}

.account-dialog-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(117, 241, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(117, 241, 255, 0.035) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.48;
  pointer-events: none;
}

.account-dialog-panel > * {
  position: relative;
  z-index: 1;
}

.account-dialog-panel--danger {
  background:
    linear-gradient(180deg, rgba(28, 8, 24, 0.96), rgba(10, 4, 14, 0.98)),
    linear-gradient(135deg, rgba(255, 82, 205, 0.12), rgba(255, 96, 96, 0.08));
}

.account-dialog-copy {
  display: grid;
  gap: 6px;
}

.account-form-grid {
  margin-top: 16px;
  display: grid;
  gap: 14px;
}

.account-field {
  display: grid;
  gap: 8px;
}

.account-field__label {
  color: rgba(183, 216, 255, 0.78);
  font-size: 13px;
  letter-spacing: 0.08em;
}

:deep(.account-cyber-dialog .account-password-input .el-input__wrapper) {
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(117, 241, 255, 0.24);
  background:
    linear-gradient(135deg, rgba(2, 12, 30, 0.98), rgba(5, 14, 34, 0.96)),
    linear-gradient(135deg, rgba(0, 145, 255, 0.12), rgba(255, 82, 205, 0.08)) !important;
  box-shadow:
    inset 0 0 0 1px rgba(117, 241, 255, 0.2),
    inset 0 0 18px rgba(117, 241, 255, 0.06),
    0 0 0 1px rgba(8, 29, 62, 0.58),
    0 0 18px rgba(0, 145, 255, 0.08) !important;
  clip-path: polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px));
  transition:
    box-shadow var(--cyber-ease),
    border-color var(--cyber-ease),
    filter var(--cyber-ease),
    transform var(--cyber-ease);
}

:deep(.account-cyber-dialog .account-password-input .el-input__wrapper:hover) {
  border-color: rgba(117, 241, 255, 0.38);
  box-shadow:
    inset 0 0 0 1px rgba(117, 241, 255, 0.3),
    inset 0 0 20px rgba(117, 241, 255, 0.08),
    0 0 16px rgba(0, 145, 255, 0.12),
    0 0 24px rgba(117, 241, 255, 0.08) !important;
}

:deep(.account-cyber-dialog .account-password-input .el-input__wrapper.is-focus) {
  border-color: rgba(117, 241, 255, 0.6);
  box-shadow:
    inset 0 0 0 1px rgba(117, 241, 255, 0.58),
    inset 0 0 24px rgba(117, 241, 255, 0.1),
    0 0 0 3px rgba(117, 241, 255, 0.12),
    0 0 22px rgba(0, 145, 255, 0.18);
  filter: brightness(1.04);
}

:deep(.account-cyber-dialog .account-password-input .el-input__inner) {
  color: #dcf9ff;
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.18),
    0 0 18px rgba(74, 232, 255, 0.08);
  letter-spacing: 0.03em;
  font-weight: 500;
  caret-color: #75f1ff;
}

:deep(.account-cyber-dialog .account-password-input .el-input__inner::placeholder) {
  color: rgba(170, 205, 255, 0.56);
  text-shadow: none;
}

:deep(.account-cyber-dialog .account-password-input .el-input__prefix),
:deep(.account-cyber-dialog .account-password-input .el-input__suffix-inner) {
  color: rgba(117, 241, 255, 0.74);
}

:deep(.account-cyber-dialog .account-password-input .el-input__password) {
  color: rgba(117, 241, 255, 0.74);
  transition:
    color var(--cyber-ease),
    filter var(--cyber-ease),
    text-shadow var(--cyber-ease);
}

:deep(.account-cyber-dialog .account-password-input .el-input__password:hover) {
  color: #dcf9ff;
  filter: brightness(1.08);
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.32);
}

:deep(.account-cyber-dialog .account-password-input .el-input__password:focus-visible) {
  color: #dcf9ff;
  outline: none;
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.32),
    0 0 14px rgba(255, 82, 205, 0.12);
}

:deep(.account-cyber-dialog .account-password-input .el-input__icon) {
  color: rgba(117, 241, 255, 0.84);
  filter: drop-shadow(0 0 8px rgba(117, 241, 255, 0.22));
}

.password-strength-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(140px, 156px);
  gap: 12px;
  align-items: center;
}

.password-strength-meter {
  min-width: 140px;
  min-height: 46px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  background:
    linear-gradient(135deg, rgba(4, 18, 46, 0.82), rgba(4, 10, 24, 0.9)),
    linear-gradient(135deg, rgba(0, 145, 255, 0.08), rgba(255, 82, 205, 0.05));
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.05),
    0 0 0 1px rgba(5, 20, 46, 0.42);
  transition:
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    filter var(--cyber-ease);
}

.password-strength-meter__bars {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.password-strength-meter__bar {
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(22, 39, 78, 0.9), rgba(8, 18, 42, 0.96));
  box-shadow:
    inset 0 0 0 1px rgba(117, 241, 255, 0.08),
    inset 0 0 8px rgba(117, 241, 255, 0.04);
  transition:
    background var(--cyber-ease),
    box-shadow var(--cyber-ease),
    filter var(--cyber-ease),
    opacity var(--cyber-ease);
  opacity: 0.58;
}

.password-strength-meter__label {
  min-width: 24px;
  text-align: right;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: rgba(223, 239, 255, 0.72);
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.1);
}

.password-strength-meter.is-low {
  border-color: rgba(255, 132, 160, 0.28);
  box-shadow:
    inset 0 0 16px rgba(255, 132, 160, 0.06),
    0 0 14px rgba(255, 82, 205, 0.08);
}

.password-strength-meter.is-low .password-strength-meter__bar:nth-child(-n + 1) {
  background: linear-gradient(135deg, rgba(255, 95, 154, 0.96), rgba(255, 148, 187, 0.82));
  box-shadow:
    inset 0 0 0 1px rgba(255, 209, 226, 0.28),
    0 0 12px rgba(255, 95, 154, 0.32);
  opacity: 1;
}

.password-strength-meter.is-low .password-strength-meter__label {
  color: #ffbdd0;
  text-shadow: 0 0 12px rgba(255, 95, 154, 0.2);
}

.password-strength-meter.is-medium {
  border-color: rgba(255, 211, 120, 0.34);
  box-shadow:
    inset 0 0 16px rgba(255, 211, 120, 0.06),
    0 0 14px rgba(255, 191, 84, 0.1);
}

.password-strength-meter.is-medium .password-strength-meter__bar:nth-child(-n + 2) {
  background: linear-gradient(135deg, rgba(255, 189, 84, 0.98), rgba(255, 224, 139, 0.84));
  box-shadow:
    inset 0 0 0 1px rgba(255, 239, 194, 0.28),
    0 0 12px rgba(255, 191, 84, 0.28);
  opacity: 1;
}

.password-strength-meter.is-medium .password-strength-meter__label {
  color: #ffe1a9;
  text-shadow: 0 0 12px rgba(255, 191, 84, 0.18);
}

.password-strength-meter.is-high {
  border-color: rgba(117, 241, 255, 0.4);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.08),
    0 0 18px rgba(0, 145, 255, 0.12);
}

.password-strength-meter.is-high .password-strength-meter__bar:nth-child(-n + 3) {
  background: linear-gradient(135deg, rgba(74, 232, 255, 0.98), rgba(164, 255, 255, 0.86));
  box-shadow:
    inset 0 0 0 1px rgba(225, 255, 255, 0.28),
    0 0 14px rgba(74, 232, 255, 0.28);
  opacity: 1;
}

.password-strength-meter.is-high .password-strength-meter__label {
  color: #dcf9ff;
  text-shadow: 0 0 12px rgba(74, 232, 255, 0.2);
}

.account-dialog-actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.account-dialog-confirm {
  min-width: 132px;
}

.destroy-warning-text {
  margin: 0;
  color: #ffd6e7;
  line-height: 1.8;
  font-size: 15px;
}

.account-dialog-critical {
  border-color: rgba(255, 119, 165, 0.58);
  background:
    linear-gradient(135deg, rgba(255, 82, 205, 0.24), rgba(255, 110, 110, 0.16)),
    linear-gradient(135deg, rgba(3, 17, 42, 0.94), rgba(5, 11, 28, 0.9)) !important;
  color: #ffd7e6 !important;
}

.avatar-dialog-text {
  margin: 0;
  color: var(--cyber-text-muted);
}

.avatar-dialog-subtext {
  margin: 6px 0 0;
  color: rgba(183, 216, 255, 0.78);
  font-size: 13px;
  letter-spacing: 0.04em;
}

.avatar-dialog-panel {
  position: relative;
  overflow: hidden;
  padding: 18px;
  background:
    linear-gradient(180deg, rgba(8, 21, 46, 0.92), rgba(3, 10, 26, 0.96)),
    linear-gradient(135deg, rgba(0, 145, 255, 0.12), rgba(255, 82, 205, 0.08));
}

.avatar-dialog-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(117, 241, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(117, 241, 255, 0.045) 1px, transparent 1px);
  background-size: 22px 22px;
  opacity: 0.55;
  pointer-events: none;
}

.avatar-dialog-copy,
.avatar-upload-zone,
.avatar-file-input,
.avatar-preview-card,
.avatar-dialog-actions,
.avatar-dialog-footnote {
  position: relative;
  z-index: 1;
}

.avatar-crop-panel {
  position: relative;
  padding: 18px;
  background:
    linear-gradient(180deg, rgba(8, 21, 46, 0.92), rgba(3, 10, 26, 0.96)),
    linear-gradient(135deg, rgba(0, 145, 255, 0.12), rgba(255, 82, 205, 0.08));
}

.avatar-crop-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(117, 241, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(117, 241, 255, 0.035) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.5;
  pointer-events: none;
}

.avatar-crop-panel > * {
  position: relative;
  z-index: 1;
}

.avatar-upload-zone {
  position: relative;
  width: 100%;
  margin-top: 16px;
  border: 1px solid rgba(117, 241, 255, 0.34);
  border-radius: 18px;
  padding: 28px 18px 24px;
  display: grid;
  gap: 8px;
  justify-items: center;
  background:
    radial-gradient(circle at 50% 15%, rgba(117, 241, 255, 0.18), transparent 45%),
    linear-gradient(135deg, rgba(2, 18, 48, 0.96), rgba(8, 15, 38, 0.92));
  color: var(--cyber-text);
  cursor: pointer;
  transition:
    transform var(--cyber-ease),
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    filter var(--cyber-ease);
}

.avatar-upload-zone:hover,
.avatar-upload-zone:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(117, 241, 255, 0.62);
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.14),
    0 0 20px rgba(117, 241, 255, 0.22);
  outline: none;
}

.avatar-upload-zone.is-selected {
  border-color: rgba(255, 82, 205, 0.42);
  box-shadow:
    inset 0 0 20px rgba(255, 82, 205, 0.08),
    0 0 22px rgba(0, 145, 255, 0.18);
}

.avatar-upload-zone.is-uploading {
  pointer-events: none;
  filter: saturate(1.08);
}

.avatar-upload-zone__frame,
.avatar-upload-zone__scanline {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

.avatar-upload-zone__frame {
  inset: 10px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  clip-path: polygon(0 14px, 14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px));
}

.avatar-upload-zone__scanline {
  background: linear-gradient(180deg, rgba(117, 241, 255, 0.16), transparent 26%, transparent 74%, rgba(255, 82, 205, 0.12));
  opacity: 0.75;
}

.avatar-upload-zone__eyebrow {
  font-size: 11px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: rgba(117, 241, 255, 0.78);
}

.avatar-upload-zone__title {
  font-size: 24px;
  color: var(--cyber-cyan);
  text-shadow: 0 0 14px rgba(117, 241, 255, 0.46);
}

.avatar-upload-zone__desc {
  font-size: 13px;
  color: rgba(232, 251, 255, 0.78);
}

.hidden-avatar-input {
  display: none;
}

.hidden-crop-canvas {
  display: none;
}

.avatar-preview-card {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  border-radius: 16px;
  padding: 12px 14px;
  background: rgba(4, 12, 28, 0.72);
}

.avatar-preview-meta {
  display: grid;
  gap: 4px;
}

.avatar-preview-label {
  color: var(--cyber-cyan);
  font-size: 14px;
  letter-spacing: 0.08em;
}

.avatar-preview-hint {
  color: var(--cyber-text-muted);
  font-size: 12px;
}

.avatar-crop-stage {
  position: relative;
  width: min(100%, 260px);
  height: 260px;
  margin: 18px auto 0;
  overflow: hidden;
  border: 1px solid rgba(117, 241, 255, 0.18);
  border-radius: 20px;
  background:
    radial-gradient(circle at top, rgba(117, 241, 255, 0.14), transparent 38%),
    linear-gradient(180deg, rgba(3, 12, 32, 0.98), rgba(2, 8, 22, 0.96));
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.08),
    0 0 20px rgba(0, 145, 255, 0.12);
  cursor: grab;
}

.avatar-crop-stage:active {
  cursor: grabbing;
}

.avatar-crop-image {
  position: absolute;
  inset: 0;
  max-width: none;
  user-select: none;
  pointer-events: none;
}

.avatar-crop-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.avatar-crop-circle {
  position: relative;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  box-shadow: 0 0 0 999px rgba(1, 6, 18, 0.62);
  border: 1px solid rgba(117, 241, 255, 0.54);
  backdrop-filter: saturate(1.06);
}

.avatar-crop-circle::before {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(117, 241, 255, 0.24);
  border-radius: 50%;
}

.avatar-crop-reticle {
  position: absolute;
  inset: 50%;
  width: 54px;
  height: 54px;
  margin: -27px 0 0 -27px;
  border-radius: 50%;
  border: 1px dashed rgba(117, 241, 255, 0.34);
}

.avatar-crop-reticle::before,
.avatar-crop-reticle::after {
  content: '';
  position: absolute;
  background: rgba(117, 241, 255, 0.28);
}

.avatar-crop-reticle::before {
  top: 50%;
  left: -18px;
  right: -18px;
  height: 1px;
  transform: translateY(-50%);
}

.avatar-crop-reticle::after {
  left: 50%;
  top: -18px;
  bottom: -18px;
  width: 1px;
  transform: translateX(-50%);
}

.avatar-crop-live-preview {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid rgba(117, 241, 255, 0.18);
  border-radius: 16px;
  padding: 12px 14px;
  background: rgba(4, 12, 28, 0.72);
}

.avatar-crop-live-preview__meta {
  display: grid;
  gap: 4px;
}

.avatar-crop-live-preview__frame {
  position: relative;
  width: 112px;
  height: 112px;
  overflow: hidden;
  border-radius: 50%;
  border: 1px solid rgba(117, 241, 255, 0.42);
  background:
    radial-gradient(circle at top, rgba(117, 241, 255, 0.12), transparent 40%),
    linear-gradient(180deg, rgba(3, 12, 32, 0.98), rgba(2, 8, 22, 0.96));
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.08),
    0 0 14px rgba(0, 145, 255, 0.12);
}

.avatar-crop-live-preview__image {
  position: absolute;
  inset: 0;
  max-width: none;
  user-select: none;
  pointer-events: none;
}

.avatar-crop-toolbar {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.avatar-crop-scale-label {
  min-width: 72px;
  text-align: center;
  color: var(--cyber-cyan);
  letter-spacing: 0.08em;
}

.avatar-crop-slider {
  margin-top: 14px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.avatar-crop-slider__label,
.avatar-crop-slider__value {
  color: var(--cyber-text-muted);
  font-size: 13px;
}

.avatar-crop-slider__value {
  min-width: 48px;
  text-align: right;
  color: var(--cyber-cyan);
}

.avatar-crop-slider__input {
  width: 100%;
  accent-color: var(--cyber-cyan);
  cursor: pointer;
}

.avatar-crop-actions {
  margin-top: 18px;
}

.avatar-dialog-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.avatar-dialog-secondary,
.avatar-dialog-primary {
  min-width: 110px;
}

.avatar-dialog-btn {
  position: relative;
  overflow: hidden;
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(117, 241, 255, 0.3);
  padding: 0 18px !important;
  background:
    linear-gradient(135deg, rgba(3, 17, 42, 0.94), rgba(5, 11, 28, 0.9)) !important;
  color: var(--cyber-text) !important;
  box-shadow:
    inset 0 0 14px rgba(117, 241, 255, 0.08),
    0 0 16px rgba(0, 145, 255, 0.1);
  transition:
    transform var(--cyber-ease),
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    filter var(--cyber-ease);
}

.avatar-dialog-btn:hover,
.avatar-dialog-btn:focus-visible {
  transform: translateY(-1px);
  outline: none;
}

.avatar-dialog-btn__frame,
.avatar-dialog-btn__scanline {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

.avatar-dialog-btn__frame {
  inset: 6px;
  border: 1px solid rgba(117, 241, 255, 0.16);
  clip-path: polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px));
}

.avatar-dialog-btn__scanline {
  background: linear-gradient(180deg, rgba(117, 241, 255, 0.12), transparent 28%, transparent 72%, rgba(255, 82, 205, 0.1));
  opacity: 0.85;
}

.avatar-dialog-btn__label {
  position: relative;
  z-index: 1;
  letter-spacing: 0.08em;
}

.avatar-dialog-secondary {
  border-color: rgba(117, 241, 255, 0.34);
}

.avatar-dialog-secondary:hover,
.avatar-dialog-secondary:focus-visible {
  border-color: rgba(117, 241, 255, 0.6);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.12),
    0 0 18px rgba(117, 241, 255, 0.18);
}

.avatar-dialog-primary {
  border-color: rgba(117, 241, 255, 0.54);
  background:
    linear-gradient(135deg, rgba(0, 145, 255, 0.24), rgba(255, 82, 205, 0.18)),
    linear-gradient(135deg, rgba(3, 17, 42, 0.94), rgba(5, 11, 28, 0.9)) !important;
  color: var(--cyber-cyan) !important;
  box-shadow:
    inset 0 0 18px rgba(117, 241, 255, 0.16),
    0 0 20px rgba(0, 145, 255, 0.16);
}

.avatar-dialog-primary:hover,
.avatar-dialog-primary:focus-visible {
  border-color: rgba(117, 241, 255, 0.75);
  box-shadow:
    inset 0 0 22px rgba(117, 241, 255, 0.2),
    0 0 22px rgba(117, 241, 255, 0.26);
  filter: brightness(1.06);
}

.avatar-dialog-btn.is-disabled,
.avatar-dialog-btn:disabled {
  opacity: 0.72;
  transform: none;
  box-shadow: inset 0 0 10px rgba(117, 241, 255, 0.08);
}

.avatar-dialog-footnote {
  margin: 12px 0 0;
  color: rgba(183, 216, 255, 0.68);
  font-size: 12px;
}

.avatar-preview {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(117, 241, 255, 0.48);
  box-shadow: 0 0 12px rgba(117, 241, 255, 0.32);
}

:deep(.avatar-cyber-dialog) {
  --el-dialog-bg-color: rgba(3, 10, 24, 0.96);
  --el-dialog-padding-primary: 0;
  border: 1px solid rgba(117, 241, 255, 0.32);
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    inset 0 0 22px rgba(117, 241, 255, 0.08),
    0 0 32px rgba(0, 145, 255, 0.26);
}

:deep(.avatar-cyber-dialog .el-dialog__header) {
  margin: 0;
  padding: 18px 20px 14px;
  background:
    linear-gradient(90deg, rgba(117, 241, 255, 0.12), transparent 45%),
    linear-gradient(180deg, rgba(6, 22, 50, 0.96), rgba(4, 12, 28, 0.92));
  border-bottom: 1px solid rgba(117, 241, 255, 0.16);
}

:deep(.avatar-cyber-dialog .el-dialog__title) {
  color: var(--cyber-cyan);
  letter-spacing: 0.12em;
  text-shadow: 0 0 10px rgba(117, 241, 255, 0.45);
}

:deep(.avatar-cyber-dialog .el-dialog__headerbtn) {
  top: 16px;
  right: 16px;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(117, 241, 255, 0.34);
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(3, 17, 42, 0.96), rgba(5, 11, 28, 0.92)),
    linear-gradient(135deg, rgba(0, 145, 255, 0.12), rgba(255, 82, 205, 0.08));
  box-shadow:
    inset 0 0 12px rgba(117, 241, 255, 0.08),
    0 0 14px rgba(0, 145, 255, 0.12);
  transition:
    border-color var(--cyber-ease),
    box-shadow var(--cyber-ease),
    transform var(--cyber-ease),
    filter var(--cyber-ease);
}

:deep(.avatar-cyber-dialog .el-dialog__headerbtn:hover),
:deep(.avatar-cyber-dialog .el-dialog__headerbtn:focus-visible) {
  border-color: rgba(117, 241, 255, 0.68);
  box-shadow:
    inset 0 0 16px rgba(117, 241, 255, 0.14),
    0 0 18px rgba(117, 241, 255, 0.2);
  transform: translateY(-1px);
  filter: brightness(1.04);
  outline: none;
}

:deep(.avatar-cyber-dialog .el-dialog__headerbtn:active) {
  transform: translateY(0);
}

:deep(.avatar-cyber-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: var(--cyber-cyan);
  font-size: 18px;
  text-shadow: 0 0 8px rgba(117, 241, 255, 0.36);
  transition: color var(--cyber-ease), text-shadow var(--cyber-ease), filter var(--cyber-ease);
}

:deep(.avatar-cyber-dialog .el-dialog__headerbtn:hover .el-dialog__close),
:deep(.avatar-cyber-dialog .el-dialog__headerbtn:focus-visible .el-dialog__close) {
  color: #dcf9ff;
  text-shadow:
    0 0 10px rgba(117, 241, 255, 0.5),
    0 0 16px rgba(255, 82, 205, 0.2);
  filter: brightness(1.08);
}

:deep(.avatar-cyber-dialog .el-dialog__body) {
  padding: 18px;
  background:
    radial-gradient(circle at top, rgba(117, 241, 255, 0.08), transparent 35%),
    linear-gradient(180deg, rgba(4, 12, 28, 0.98), rgba(1, 6, 18, 0.98));
}

@media (prefers-reduced-motion: reduce) {
  .avatar-upload-zone,
  .avatar-dialog-btn {
    transition: none;
  }
}

@media (max-width: 860px) {
  .center-container {
    grid-template-columns: 1fr;
  }

  .profile-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .saved-city-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .danger-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .center-page {
    min-height: calc(100vh - var(--app-nav-height-mobile));
    padding-top: 20px;
  }

  .saved-city-list {
    grid-template-columns: 1fr;
  }

  .avatar-dialog-panel {
    padding: 14px;
  }

  .avatar-upload-zone__title {
    font-size: 20px;
  }

  .avatar-preview-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .avatar-crop-stage {
    height: 260px;
  }

  .avatar-crop-toolbar {
    flex-direction: column;
  }

  .avatar-crop-live-preview {
    flex-direction: column;
    align-items: flex-start;
  }

  .avatar-crop-slider {
    grid-template-columns: 1fr;
  }

  .avatar-crop-slider__value {
    text-align: left;
  }

  .avatar-dialog-actions {
    flex-direction: column;
  }

  .password-strength-row {
    grid-template-columns: 1fr;
  }

  .password-strength-meter {
    min-width: 100%;
  }

  .account-dialog-actions {
    flex-direction: column;
  }
}
</style>
