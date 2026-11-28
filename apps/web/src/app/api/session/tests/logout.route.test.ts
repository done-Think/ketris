import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getToken, tenantLogout, platformLogout } = vi.hoisted(() => ({
  getToken: vi.fn(),
  tenantLogout: vi.fn(),
  platformLogout: vi.fn(),
}))

vi.mock('next-auth/jwt', () => ({ getToken }))
vi.mock('@server/auth/container', () => ({
  authContainer: { logoutUseCase: { execute: tenantLogout } },
}))
vi.mock('@server/platform/container', () => ({
  platformContainer: { logoutPlatformAdminUseCase: { execute: platformLogout } },
}))

import { POST } from '../logout/route'

function request() {
  return new NextRequest('http://localhost/api/session/logout', { method: 'POST' })
}

describe('session logout route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    tenantLogout.mockResolvedValue(undefined)
    platformLogout.mockResolvedValue(undefined)
  })

  it('revokes the tenant refresh token kept in the encrypted session cookie', async () => {
    getToken.mockResolvedValue({ scope: 'tenant', refreshToken: 'tenant-refresh' })
    const response = await POST(request())
    expect(response.status).toBe(204)
    expect(tenantLogout).toHaveBeenCalledWith({ refreshToken: 'tenant-refresh' })
    expect(platformLogout).not.toHaveBeenCalled()
  })

  it('revokes the platform refresh token through the platform use case', async () => {
    getToken.mockResolvedValue({ scope: 'platform', refreshToken: 'platform-refresh' })
    expect((await POST(request())).status).toBe(204)
    expect(platformLogout).toHaveBeenCalledWith('platform-refresh')
    expect(tenantLogout).not.toHaveBeenCalled()
  })

  it.each([null, { scope: 'tenant' }])(
    'does nothing without a refresh token (%j)',
    async (token) => {
      getToken.mockResolvedValue(token)
      expect((await POST(request())).status).toBe(204)
      expect(tenantLogout).not.toHaveBeenCalled()
      expect(platformLogout).not.toHaveBeenCalled()
    },
  )

  it('reports a revocation failure instead of pretending it worked', async () => {
    getToken.mockResolvedValue({ scope: 'tenant', refreshToken: 'tenant-refresh' })
    tenantLogout.mockRejectedValue(new Error('database unavailable'))
    expect((await POST(request())).status).toBeGreaterThanOrEqual(500)
  })
})
