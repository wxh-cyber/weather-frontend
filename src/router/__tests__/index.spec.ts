import { describe, expect, it, vi } from 'vitest'
import { resolveProtectedRoute } from '@/router'

describe('router auth guard', () => {
  it('redirects unauthenticated users away from protected routes', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => (key === 'auth_token' ? null : null)),
    })

    const result = resolveProtectedRoute('/login-list', true)

    expect(result).toEqual({
      path: '/login',
      query: {
        reason: 'unauthorized',
        redirect: '/login-list',
      },
    })
  })
})
