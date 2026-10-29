import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }))
vi.mock('@server/platform/container', () => ({
  platformContainer: { logoutPlatformAdminUseCase: { execute } },
}))

import { POST } from '../../logout/route'

function request(body: unknown) {
  return new NextRequest('http://localhost/api/platform/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('platform logout route', () => {
  beforeEach(() => {
    execute.mockReset()
    execute.mockResolvedValue(undefined)
  })

  it('revokes the supplied platform refresh token and returns an empty response', async () => {
    const response = await POST(request({ refreshToken: 'platform-refresh' }))
    expect(response.status).toBe(204)
    expect(execute).toHaveBeenCalledWith('platform-refresh')
  })

  it('rejects missing tokens before executing the logout operation', async () => {
    expect((await POST(request({}))).status).toBe(400)
    expect(execute).not.toHaveBeenCalled()
  })
})
