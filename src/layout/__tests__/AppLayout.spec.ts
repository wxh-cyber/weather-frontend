import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import AppLayout from '@/layout/AppLayout.vue'

const pushMock = vi.fn()
const routeState = {
  name: 'center',
  fullPath: '/center',
  meta: { navVariant: 'home' },
}

vi.mock('vue-router', () => ({
  RouterView: {
    template: '<div class="router-view-stub" />',
  },
  useRoute: () => routeState,
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('@/service/auth', () => ({
  getProfile: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('AppLayout center actions', () => {
  beforeEach(() => {
    pushMock.mockReset()
    routeState.name = 'center'
    routeState.fullPath = '/center'
    routeState.meta = { navVariant: 'home' }
  })

  it('navigates to login list when top nav emits login-list-click', async () => {
    const wrapper = mount(AppLayout, {
      global: {
        plugins: [createPinia()],
        stubs: {
          AppTopNav: {
            props: [
              'showMyCities',
              'showLoginList',
              'activeCenterAction',
              'loginLabel',
              'avatarUrl',
              'showLogout',
            ],
            emits: ['login-list-click'],
            template: `
              <div>
                <span class="show-my-cities">{{ showMyCities }}</span>
                <span class="show-login-list">{{ showLoginList }}</span>
                <span class="active-center-action">{{ activeCenterAction }}</span>
                <button class="login-list-trigger" @click="$emit('login-list-click')" />
              </div>
            `,
          },
          CyberCursorOverlay: true,
        },
      },
    })

    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('my-cities')

    await wrapper.find('.login-list-trigger').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/login-list')
  })
})
