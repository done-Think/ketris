import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UnauthorizedError } from '@server/shared/errors'

import { POST } from '../../../me/password/route'

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

function request(password = 'nova-senha-123', currentPassword: string | null = 'senha-atual') {
  return new NextRequest('http://localhost/api/auth/me/password', {
    method: 'POST',
    headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
    body: JSON.stringify(currentPassword === null ? { password } : { currentPassword, password }),
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
      currentPassword: 'senha-atual',
      password: 'nova-senha-123',
    })
  })

  it('requires the current password', async () => {
    const response = await POST(request('nova-senha-123', null))

    expect(response.status).toBe(400)
    expect(changeOwnPassword).not.toHaveBeenCalled()
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
