import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import Center from '@/views/Center.vue'
import { useAuthStore } from '@/store/auth'
import { getProfile, updateProfile, uploadAvatar } from '@/service/auth'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/service/auth', () => ({
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

describe('Center avatar interactions', () => {
  beforeEach(() => {
    mockedGetProfile.mockReset()
    mockedUpdateProfile.mockReset()
    mockedUploadAvatar.mockReset()

    vi.stubGlobal('URL', {
      ...(globalThis.URL || {}),
      createObjectURL: vi.fn(() => 'blob:test-avatar'),
      revokeObjectURL: vi.fn(),
    })
  })

  const mountCenter = async () => {
    const pinia = createPinia()
    const authStore = useAuthStore(pinia)
    authStore.setAuth('token', { userId: 'u-1', email: 'demo@weather.com', nickname: '演示用户' })
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
  })

  it('opens upload dialog after clicking avatar', async () => {
    const wrapper = await mountCenter()
    await wrapper.find('.avatar-trigger').trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('支持 jpg / png / webp')
    expect(wrapper.text()).toContain('点我上传头像')
    expect(wrapper.find('input[placeholder="请选择头像文件"]').exists()).toBe(false)
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
