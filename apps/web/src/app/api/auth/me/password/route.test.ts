import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UnauthorizedError } from '@server/shared/errors'

import { POST } from './route'

const { findById, changeOwnPassword, requireAuth } = vi.hoisted(() => ({
  findById: vi.fn(),
  changeOwnPassword: vi.fn().mockResolvedValue(undefined),
  requireAuth: vi.fn(),
}))

vi.mock('@server/auth/container', () => ({
  authContainer: {
    tokenService: {},
    userRepository: { findById },
    changeOwnPasswordUseCase: { execute: changeOwnPassword },
  },
}))
vi.mock('@server/auth/require-bearer-auth', () => ({ requireBearerAuth: requireAuth }))

function request(password = 'nova-senha-123') {
  return new NextRequest('http://localhost/api/auth/me/password', {
    method: 'POST',
    headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  })
}

describe('POST /api/auth/me/password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAuth.mockResolvedValue({ sub: 'current-user', tenantId: 'tenant-1' })
    findById.mockResolvedValue({
      id: 'current-user',
      tenantId: 'tenant-1',
      ativo: true,
      email: 'ana@example.com',
    })
  })

  it('changes only the bearer-authenticated user password', async () => {
    const response = await POST(request())

    expect(response.status).toBe(204)
    expect(findById).toHaveBeenCalledWith('current-user')
    expect(changeOwnPassword).toHaveBeenCalledWith({
      userId: 'current-user',
      password: 'nova-senha-123',
    })
  })

  it('rejects a user from another tenant without changing a password', async () => {
    findById.mockResolvedValue({
      id: 'current-user',
      tenantId: 'other-tenant',
      ativo: true,
      email: 'other@example.com',
    })

    const response = await POST(request())

    expect(response.status).not.toBe(204)
    expect(changeOwnPassword).not.toHaveBeenCalled()
  })

  it('does not change a password when bearer authentication fails', async () => {
    requireAuth.mockRejectedValue(new UnauthorizedError())

    const response = await POST(request())

    expect(response.status).not.toBe(204)
    expect(findById).not.toHaveBeenCalled()
    expect(changeOwnPassword).not.toHaveBeenCalled()
  })

  it('rejects passwords shorter than the existing eight-character rule', async () => {
    const response = await POST(request('short'))

    expect(response.status).not.toBe(204)
    expect(changeOwnPassword).not.toHaveBeenCalled()
  })
})
