import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getUser, updateUser, deactivateUser, approveUser, requestEmailChange, verifyToken } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    updateUser: vi.fn(),
    deactivateUser: vi.fn(),
    approveUser: vi.fn(),
    requestEmailChange: vi.fn(),
    verifyToken: vi.fn(),
  }))

vi.mock('@server/auth/container', () => ({
  authContainer: {
    tokenService: { verify: verifyToken },
    getUserUseCase: { execute: getUser },
    updateUserUseCase: { execute: updateUser },
    deactivateUserUseCase: { execute: deactivateUser },
    approveUserMembershipUseCase: { execute: approveUser },
    requestEmailChangeUseCase: { execute: requestEmailChange },
  },
}))

import { DELETE, GET, PATCH } from '@/app/api/auth/users/[id]/route'
import { PATCH as APPROVE } from '@/app/api/auth/users/[id]/approve/route'
import { POST as REQUEST_EMAIL_CHANGE } from '@/app/api/auth/users/[id]/email-change/route'

describe('Validação de parâmetros HTTP dos usuários Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    verifyToken.mockResolvedValue({ sub: 'owner', tenantId: 'tenant', role: 'OWNER' })
  })

  it.each([
    ['GET', GET],
    ['PATCH', PATCH],
    ['DELETE', DELETE],
    ['PATCH approve', APPROVE],
    ['POST email-change', REQUEST_EMAIL_CHANGE],
  ] as const)('rejeita id vazio em %s antes de executar a operação', async (_name, handler) => {
    const response = await handler(
      new NextRequest('http://localhost/api/auth/users/invalid', {
        headers: { authorization: 'Bearer access-token' },
      }),
      { params: Promise.resolve({ id: '' }) },
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR', issues: [{ path: 'id' }] },
    })
    expect(getUser).not.toHaveBeenCalled()
    expect(updateUser).not.toHaveBeenCalled()
    expect(deactivateUser).not.toHaveBeenCalled()
    expect(approveUser).not.toHaveBeenCalled()
    expect(requestEmailChange).not.toHaveBeenCalled()
  })

  it('exige autenticação antes da validação de parâmetros', async () => {
    const response = await GET(new NextRequest('http://localhost/api/auth/users/invalid'), {
      params: Promise.resolve({ id: '' }),
    })

    expect(response.status).toBe(401)
    expect(verifyToken).not.toHaveBeenCalled()
  })
})
