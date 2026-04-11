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

  it('navigates to center when top nav emits profile-center-click', async () => {
    const wrapper = mount(AppLayout, {
      global: {
        plugins: [createPinia()],
        stubs: {
          AppTopNav: {
            props: [
              'showMyCities',
              'showProfileCenter',
              'showLoginList',
              'activeCenterAction',
              'loginLabel',
              'avatarUrl',
              'showLogout',
            ],
            emits: ['profile-center-click', 'login-list-click'],
            template: `
              <div>
                <span class="show-my-cities">{{ showMyCities }}</span>
                <span class="show-profile-center">{{ showProfileCenter }}</span>
                <span class="show-login-list">{{ showLoginList }}</span>
                <span class="active-center-action">{{ activeCenterAction }}</span>
                <button class="profile-center-trigger" @click="$emit('profile-center-click')" />
                <button class="login-list-trigger" @click="$emit('login-list-click')" />
              </div>
            `,
          },
          CyberCursorOverlay: true,
        },
      },
    })

    expect(wrapper.find('.show-my-cities').text()).toBe('true')
    expect(wrapper.find('.show-profile-center').text()).toBe('true')
    expect(wrapper.find('.show-login-list').text()).toBe('true')
    expect(wrapper.find('.active-center-action').text()).toBe('profile-center')

    await wrapper.find('.profile-center-trigger').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/center')

    pushMock.mockReset()

    await wrapper.find('.login-list-trigger').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/login-list')
  })
})
