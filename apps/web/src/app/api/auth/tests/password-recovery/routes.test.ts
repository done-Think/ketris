// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requestCode, verifyCode, resetPassword } = vi.hoisted(() => ({
  requestCode: vi.fn(),
  verifyCode: vi.fn(),
  resetPassword: vi.fn(),
}))
vi.mock('@server/auth/container', () => ({
  authContainer: {
    requestPasswordResetCodeUseCase: { execute: requestCode },
    verifyPasswordResetCodeUseCase: { execute: verifyCode },
    resetPasswordUseCase: { execute: resetPassword },
  },
}))

import { POST as request } from '../../password-reset-codes/route'
import { POST as verify } from '../../password-reset-codes/verify/route'
import { POST as reset } from '../../reset-password/route'

function body(path: string, value: unknown) {
  return new NextRequest(`http://localhost/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  })
}

describe('password recovery route contracts', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns an empty generic response before any tenant selection', async () => {
    requestCode.mockResolvedValue(undefined)
    const response = await request(
      body('password-reset-codes', {
        email: ' ANA@EXAMPLE.COM ',
        locale: 'pt-BR',
      }),
    )
    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect(requestCode).toHaveBeenCalledWith({ email: 'ana@example.com', locale: 'pt-BR' })
  })
  it('rejects an early tenant selection instead of silently discarding it', async () => {
    const response = await request(
      body('password-reset-codes', {
        email: 'ana@example.com',
        locale: 'pt-BR',
        tenantId: 'not-accepted-before-proof',
      }),
    )
    expect(response.status).toBe(400)
    expect(requestCode).not.toHaveBeenCalled()
  })
  it('preserves SELECT_TENANT without manufacturing a resetToken', async () => {
    const responseBody = {
      outcome: 'SELECT_TENANT',
      tenants: [{ id: 'one', name: 'First', slug: 'first' }],
    }
    verifyCode.mockResolvedValue(responseBody)
    const response = await verify(
      body('password-reset-codes/verify', { email: 'ana@example.com', code: '123456' }),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(responseBody)
  })
  it('forwards the selected tenant only after the code and on the final reset', async () => {
    verifyCode.mockResolvedValue({ resetToken: 'signed' })
    resetPassword.mockResolvedValue(undefined)
    await verify(
      body('password-reset-codes/verify', {
        email: 'ana@example.com',
        code: '123456',
        tenantId: 'one',
      }),
    )
    expect(verifyCode).toHaveBeenCalledWith({
      email: 'ana@example.com',
      code: '123456',
      tenantId: 'one',
    })
    const response = await reset(
      body('reset-password', {
        email: 'ana@example.com',
        password: 'new-password',
        resetToken: 'signed',
        tenantId: 'one',
      }),
    )
    expect(response.status).toBe(204)
    expect(resetPassword).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'new-password',
      resetToken: 'signed',
      tenantId: 'one',
    })
  })
  it('rejects malformed proof before executing the use case', async () => {
    const response = await verify(
      body('password-reset-codes/verify', { email: 'ana@example.com', code: '123', tenantId: '' }),
    )
    expect(response.status).toBe(400)
    expect(verifyCode).not.toHaveBeenCalled()
  })
  it('rejects new passwords above 72 UTF-8 bytes before writing an account', async () => {
    const response = await reset(
      body('reset-password', {
        email: 'ana@example.com',
        password: 'á'.repeat(37),
        resetToken: 'signed',
      }),
    )
    expect(response.status).toBe(400)
    expect(resetPassword).not.toHaveBeenCalled()
  })
})
