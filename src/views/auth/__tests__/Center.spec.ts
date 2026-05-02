import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import Center from '@/views/auth/Center.vue'
import { useAuthStore } from '@/store/auth'
import { useCityStore } from '@/store/city'
import { changePassword, destroyAccount, getProfile, updateProfile, uploadAvatar } from '@/service/auth'

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('@/service/auth', () => ({
  changePassword: vi.fn(),
  destroyAccount: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

const mockedChangePassword = vi.mocked(changePassword)
const mockedDestroyAccount = vi.mocked(destroyAccount)
const mockedGetProfile = vi.mocked(getProfile)
const mockedUpdateProfile = vi.mocked(updateProfile)
const mockedUploadAvatar = vi.mocked(uploadAvatar)
const ElDialogStub = {
  props: ['modelValue', 'title'],
  emits: ['update:modelValue', 'closed'],
  template: `
    <div v-if="modelValue" class="el-dialog-stub">
      <div class="el-dialog-title">{{ title }}</div>
      <slot />
    </div>
  `,
}

const ElInputStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  `,
}

const ElButtonStub = {
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>',
}

const ElAvatarStub = {
  props: ['src'],
  template: '<div class="el-avatar-stub" :data-src="src"><slot /></div>',
}

class IntersectionObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()

  constructor(_callback?: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
}

describe('Center avatar interactions', () => {
  beforeEach(() => {
    pushMock.mockReset()
    mockedChangePassword.mockReset()
    mockedDestroyAccount.mockReset()
    mockedGetProfile.mockReset()
    mockedUpdateProfile.mockReset()
    mockedUploadAvatar.mockReset()

    vi.stubGlobal('URL', {
      ...(globalThis.URL || {}),
      createObjectURL: vi.fn(() => 'blob:test-avatar'),
      revokeObjectURL: vi.fn(),
    })
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      writable: true,
      value: vi.fn(),
    })
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  })

  const mountCenter = async () => {
    const pinia = createPinia()
    const authStore = useAuthStore(pinia)
    const cityStore = useCityStore(pinia)
    authStore.setAuth('token', { userId: 'u-1', email: 'demo@weather.com', nickname: '演示用户' })
    cityStore.setCities([
      { cityName: '武汉市', weatherText: '晴', temperature: '26°C' },
      { cityName: '上海市', weatherText: '多云', temperature: '22°C' },
    ])
    mockedGetProfile.mockResolvedValue({
      code: 0,
      message: '获取成功',
      data: {
        userId: 'u-1',
        email: 'demo@weather.com',
        nickname: '演示用户',
        phone: '',
        qq: '',
        wechat: '',
        avatarUrl: 'http://localhost:3000/uploads/avatars/current.png',
      },
    })

    const wrapper = mount(Center, {
      global: {
        plugins: [pinia],
        stubs: {
          'el-dialog': ElDialogStub,
          'el-input': ElInputStub,
          'el-button': ElButtonStub,
          'el-avatar': ElAvatarStub,
        },
      },
    })
    await nextTick()
    await Promise.resolve()
    return wrapper
  }

  it('shows hover tip text on avatar area', async () => {
    const wrapper = await mountCenter()
    expect(wrapper.text()).toContain('点我上传头像')
    expect(wrapper.text()).toContain('危险操作')
  })

  it('renders matching left nav anchors including danger zone', async () => {
    const wrapper = await mountCenter()

    expect(wrapper.find('[data-testid="center-nav-user-info"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="center-nav-contact-info"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="center-nav-city-management"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="center-nav-danger-zone"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="center-section-danger"]').exists()).toBe(true)
  })

  it('renders saved cities as cards and highlights default city', async () => {
    const wrapper = await mountCenter()
    const cards = wrapper.findAll('.city-item')

    expect(cards.length).toBeGreaterThanOrEqual(2)
    expect(cards[0]!.classes()).toContain('is-default')
    expect(cards[0]!.text()).toContain('默认城市')
    expect(wrapper.text()).toContain('武汉市')
    expect(wrapper.text()).toContain('26°C')
    expect(wrapper.text()).toContain('多云')
  })

  it('opens upload dialog after clicking avatar', async () => {
    const wrapper = await mountCenter()
    await wrapper.find('.avatar-trigger').trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('支持 jpg / png / webp')
    expect(wrapper.text()).toContain('点我上传头像')
    expect(wrapper.find('input[placeholder="请选择头像文件"]').exists()).toBe(false)
  })

  it('opens change password dialog and updates strength indicator', async () => {
    const wrapper = await mountCenter()

    const trigger = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '修改密码')
    expect(trigger).toBeTruthy()
    await trigger!.trigger('click')
    await nextTick()

    expect(wrapper.find('input[placeholder="请输入当前密码"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="请输入新密码"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="password-strength-indicator"]').text()).toBe('--')

    const inputs = wrapper.findAll('input')
    const newPasswordInput = inputs.find((input) => input.attributes('placeholder') === '请输入新密码')
    expect(newPasswordInput).toBeTruthy()
    await newPasswordInput!.setValue('Abc12345!x')
    await nextTick()

    expect(wrapper.get('[data-testid="password-strength-indicator"]').text()).toBe('高')
    expect(wrapper.get('[data-testid="password-strength-indicator"]').classes()).toContain('is-high')
    expect(wrapper.findAll('.password-strength-meter__bar')).toHaveLength(3)
  })

  it('does not submit password change when passwords are invalid', async () => {
    const wrapper = await mountCenter()

    const trigger = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '修改密码')
    expect(trigger).toBeTruthy()
    await trigger!.trigger('click')
    await nextTick()

    const inputs = wrapper.findAll('input')
    const currentPasswordInput = inputs.find((input) => input.attributes('placeholder') === '请输入当前密码')
    const newPasswordInput = inputs.find((input) => input.attributes('placeholder') === '请输入新密码')
    expect(currentPasswordInput).toBeTruthy()
    expect(newPasswordInput).toBeTruthy()

    await currentPasswordInput!.setValue('same-pass')
    await newPasswordInput!.setValue('same-pass')
    await nextTick()

    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '确认修改')
    expect(confirmButton).toBeTruthy()
    await confirmButton!.trigger('click')
    await nextTick()

    expect(mockedChangePassword).not.toHaveBeenCalled()
    expect(ElMessage.warning).toHaveBeenCalled()
  })

  it('submits password change and closes dialog on success', async () => {
    const wrapper = await mountCenter()
    mockedChangePassword.mockResolvedValue({
      code: 0,
      message: '密码修改成功',
      data: null,
    })

    const trigger = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '修改密码')
    expect(trigger).toBeTruthy()
    await trigger!.trigger('click')
    await nextTick()

    const inputs = wrapper.findAll('input')
    const currentPasswordInput = inputs.find((input) => input.attributes('placeholder') === '请输入当前密码')
    const newPasswordInput = inputs.find((input) => input.attributes('placeholder') === '请输入新密码')
    expect(currentPasswordInput).toBeTruthy()
    expect(newPasswordInput).toBeTruthy()

    await currentPasswordInput!.setValue('123456')
    await newPasswordInput!.setValue('NewPass123!')
    await nextTick()

    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '确认修改')
    expect(confirmButton).toBeTruthy()
    await confirmButton!.trigger('click')
    await nextTick()
    await Promise.resolve()

    expect(mockedChangePassword).toHaveBeenCalledWith({
      currentPassword: '123456',
      newPassword: 'NewPass123!',
    })
    expect(wrapper.find('input[placeholder="请输入当前密码"]').exists()).toBe(false)
    expect(ElMessage.success).toHaveBeenCalled()
  })

  it('opens destroy account dialog and can cancel it', async () => {
    const wrapper = await mountCenter()

    const trigger = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '注销账号')
    expect(trigger).toBeTruthy()
    await trigger!.trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('所有数据均将销毁')

    const cancelButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '取消')
    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    await nextTick()

    expect(wrapper.text()).not.toContain('所有数据均将销毁')
  })

  it('destroys account and redirects to login on success', async () => {
    const wrapper = await mountCenter()
    mockedDestroyAccount.mockResolvedValue({
      code: 0,
      message: '账号已注销',
      data: null,
    })

    const trigger = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '注销账号')
    expect(trigger).toBeTruthy()
    await trigger!.trigger('click')
    await nextTick()

    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '确认销毁')
    expect(confirmButton).toBeTruthy()
    await confirmButton!.trigger('click')
    await nextTick()
    await Promise.resolve()

    expect(mockedDestroyAccount).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith('/login')
    expect(ElMessage.success).toHaveBeenCalled()
  })

  it('triggers native file picker after clicking upload zone', async () => {
    const wrapper = await mountCenter()
    await wrapper.find('.avatar-trigger').trigger('click')
    await nextTick()

    const hiddenInput = wrapper.find('.hidden-avatar-input')
    expect(hiddenInput.exists()).toBe(true)
    const clickSpy = vi.spyOn(hiddenInput.element as HTMLInputElement, 'click')

    await wrapper.find('.avatar-upload-zone').trigger('click')

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('opens crop dialog after selecting a valid image and allows confirming crop', async () => {
    const wrapper = await mountCenter()
    await wrapper.find('.avatar-trigger').trigger('click')
    await nextTick()

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const exposed = (wrapper.vm as {
      $?: {
        exposed?: {
          __testOpenCropDialog?: (file: File) => void
          __testApplyCroppedAvatar?: (file: File) => void
          __testGetCropPreviewSyncMetrics?: () => {
            viewportWidth: number
            viewportHeight: number
            viewportOffsetX: number
            viewportOffsetY: number
            previewWidth: number
            previewHeight: number
            previewOffsetX: number
            previewOffsetY: number
            ratio: number
          }
        }
      }
    }).$?.exposed

    expect(exposed?.__testOpenCropDialog).toBeTypeOf('function')
    exposed?.__testOpenCropDialog?.(file)
    await nextTick()

    expect(wrapper.text()).toContain('裁剪头像')
    expect(wrapper.text()).toContain('支持上下左右拖拽调整头像视口')
    expect(wrapper.text()).toContain('圆形区域可移动到图像外侧')
    expect(wrapper.text()).toContain('缩小')
    expect(wrapper.text()).toContain('放大')
    expect(wrapper.text()).toContain('实时预览')
    expect(wrapper.find('input[type="range"]').exists()).toBe(true)
    expect(exposed?.__testGetCropPreviewSyncMetrics).toBeTypeOf('function')
    const syncMetrics = exposed?.__testGetCropPreviewSyncMetrics?.()
    expect(syncMetrics?.previewWidth).toBeCloseTo((syncMetrics?.viewportWidth ?? 0) * (syncMetrics?.ratio ?? 0))
    expect(syncMetrics?.previewHeight).toBeCloseTo((syncMetrics?.viewportHeight ?? 0) * (syncMetrics?.ratio ?? 0))
    expect(syncMetrics?.previewOffsetX).toBeCloseTo(
      (syncMetrics?.viewportOffsetX ?? 0) * (syncMetrics?.ratio ?? 0),
    )
    expect(syncMetrics?.previewOffsetY).toBeCloseTo(
      (syncMetrics?.viewportOffsetY ?? 0) * (syncMetrics?.ratio ?? 0),
    )

    expect(exposed?.__testApplyCroppedAvatar).toBeTypeOf('function')
    exposed?.__testApplyCroppedAvatar?.(file)
    await nextTick()

    expect(wrapper.text()).toContain('已选择 avatar.png')
  })

  it('initializes crop dialog with minimum 100% scale and allows moving crop outside image bounds', async () => {
    const wrapper = await mountCenter()
    const exposed = (wrapper.vm as {
      $?: {
        exposed?: {
          __testOpenCropDialog?: (file: File, meta?: { width: number; height: number }) => void
          __testGetCropMetrics?: () => {
            cropMinScale: number
            cropScale: number
            cropOffsetX: number
            cropOffsetY: number
          }
          __testSetCropOffset?: (x: number, y: number) => void
        }
      }
    }).$?.exposed

    expect(exposed?.__testOpenCropDialog).toBeTypeOf('function')
    expect(exposed?.__testGetCropMetrics).toBeTypeOf('function')
    expect(exposed?.__testSetCropOffset).toBeTypeOf('function')

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    exposed?.__testOpenCropDialog?.(file, { width: 480, height: 320 })
    await nextTick()
    const landscape = exposed?.__testGetCropMetrics?.()
    expect(landscape?.cropMinScale).toBe(1)
    expect(landscape?.cropScale).toBe(1)

    exposed?.__testOpenCropDialog?.(file, { width: 320, height: 480 })
    await nextTick()
    const portrait = exposed?.__testGetCropMetrics?.()
    expect(portrait?.cropMinScale).toBe(1)
    expect(portrait?.cropScale).toBe(1)

    exposed?.__testOpenCropDialog?.(file, { width: 360, height: 360 })
    await nextTick()
    const square = exposed?.__testGetCropMetrics?.()
    expect(square?.cropMinScale).toBe(1)
    expect(square?.cropScale).toBe(1)

    exposed?.__testSetCropOffset?.(420, -360)
    await nextTick()
    const moved = exposed?.__testGetCropMetrics?.()
    expect(moved?.cropOffsetX).toBe(420)
    expect(moved?.cropOffsetY).toBe(-360)
  })

  it('uploads avatar and saves avatarUrl', async () => {
    const wrapper = await mountCenter()
    mockedUploadAvatar.mockResolvedValue({
      code: 0,
      message: '头像上传成功',
      data: {
        avatarUrl: 'http://localhost:3000/uploads/avatars/a.png',
      },
    })
    mockedUpdateProfile.mockResolvedValue({
      code: 0,
      message: '保存成功',
      data: {
        userId: 'u-1',
        email: 'demo@weather.com',
        nickname: '演示用户',
        phone: '',
        qq: '',
        wechat: '',
        avatarUrl: 'http://localhost:3000/uploads/avatars/a.png',
      },
    })

    await wrapper.find('.avatar-trigger').trigger('click')
    await nextTick()
    await Promise.resolve()
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const exposed = (wrapper.vm as {
      $?: {
        exposed?: {
          __testOpenCropDialog?: (file: File, meta?: { width: number; height: number }) => void
          __testApplyCroppedAvatar?: (file: File) => void
        }
      }
    }).$?.exposed
    expect(exposed?.__testOpenCropDialog).toBeTypeOf('function')
    exposed?.__testOpenCropDialog?.(file)
    await nextTick()
    expect(exposed?.__testApplyCroppedAvatar).toBeTypeOf('function')
    exposed?.__testApplyCroppedAvatar?.(file)
    await nextTick()
    expect(wrapper.text()).toContain('已选择 avatar.png')

    const uploadButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '上传头像')
    expect(uploadButton).toBeTruthy()
    await uploadButton!.trigger('click')
    await nextTick()
    await Promise.resolve()

    expect(mockedUploadAvatar).toHaveBeenCalledTimes(1)
    expect(mockedUpdateProfile).toHaveBeenCalledWith({
      avatarUrl: 'http://localhost:3000/uploads/avatars/a.png',
    })
  })

  it('rolls back avatar preview when upload fails', async () => {
    const wrapper = await mountCenter()
    mockedUploadAvatar.mockRejectedValue(new Error('上传失败'))

    await wrapper.find('.avatar-trigger').trigger('click')
    await nextTick()
    await Promise.resolve()
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const exposed = (wrapper.vm as {
      $?: {
        exposed?: {
          __testOpenCropDialog?: (file: File, meta?: { width: number; height: number }) => void
          __testApplyCroppedAvatar?: (file: File) => void
        }
      }
    }).$?.exposed
    expect(exposed?.__testOpenCropDialog).toBeTypeOf('function')
    exposed?.__testOpenCropDialog?.(file)
    await nextTick()
    expect(exposed?.__testApplyCroppedAvatar).toBeTypeOf('function')
    exposed?.__testApplyCroppedAvatar?.(file)
    await nextTick()

    const uploadButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '上传头像')
    expect(uploadButton).toBeTruthy()
    await uploadButton!.trigger('click')
    await nextTick()
    await Promise.resolve()

    expect(ElMessage.error).toHaveBeenCalled()
    expect(mockedUpdateProfile).not.toHaveBeenCalled()
  })

  it('cancels crop dialog without replacing current avatar preview', async () => {
    const wrapper = await mountCenter()
    await wrapper.find('.avatar-trigger').trigger('click')
    await nextTick()

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const exposed = (wrapper.vm as {
      $?: {
        exposed?: {
          __testOpenCropDialog?: (file: File, meta?: { width: number; height: number }) => void
        }
      }
    }).$?.exposed
    expect(exposed?.__testOpenCropDialog).toBeTypeOf('function')
    exposed?.__testOpenCropDialog?.(file)
    await nextTick()

    const cancelCropButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '取消裁剪')
    expect(cancelCropButton).toBeTruthy()
    await cancelCropButton!.trigger('click')
    await nextTick()

    expect(wrapper.text()).not.toContain('拖拽图片调整头像视口')
    expect(wrapper.text()).not.toContain('已选择 avatar.png')
  })
})
