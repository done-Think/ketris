import { describe, expect, it, vi } from 'vitest'

import { HttpClient } from '@shared/lib/api/http-client'
import { PasswordRecoveryService } from '../../services/password-recovery-service'

describe('PasswordRecoveryService', () => {
  it('requests proof of mailbox ownership without a tenant and avoids session refresh', async () => {
    const http = new HttpClient('/api')
    const post = vi.spyOn(http, 'post').mockResolvedValue(undefined)
    await new PasswordRecoveryService(http).requestCode('ana@example.com', 'pt-BR')
    expect(post).toHaveBeenCalledWith(
      '/auth/password-reset-codes',
      { email: 'ana@example.com', locale: 'pt-BR' },
      { skipUnauthorizedHandling: true },
    )
  })
  it('preserves selection response and resubmits the same code with one selected account', async () => {
    const http = new HttpClient('/api')
    const selection = {
      outcome: 'SELECT_TENANT',
      tenants: [{ id: 'one', name: 'First', slug: 'first' }],
    }
    const post = vi
      .spyOn(http, 'post')
      .mockResolvedValueOnce(selection)
      .mockResolvedValueOnce({ resetToken: 'signed' })
    const service = new PasswordRecoveryService(http)
    await expect(service.verifyCode('ana@example.com', '123456')).resolves.toEqual(selection)
    await expect(service.verifyCode('ana@example.com', '123456', 'one')).resolves.toEqual({
      resetToken: 'signed',
    })
    expect(post).toHaveBeenNthCalledWith(
      1,
      '/auth/password-reset-codes/verify',
      { email: 'ana@example.com', code: '123456' },
      { skipUnauthorizedHandling: true },
    )
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/auth/password-reset-codes/verify',
      { email: 'ana@example.com', code: '123456', tenantId: 'one' },
      { skipUnauthorizedHandling: true },
    )
  })
  it('passes the scoped token and tenant unchanged to reset-password', async () => {
    const http = new HttpClient('/api')
    const post = vi.spyOn(http, 'post').mockResolvedValue(undefined)
    const input = {
      email: 'ana@example.com',
      password: 'new-password',
      resetToken: 'signed',
      tenantId: 'one',
    }
    await new PasswordRecoveryService(http).resetPassword(input)
    expect(post).toHaveBeenCalledWith('/auth/reset-password', input, {
      skipUnauthorizedHandling: true,
    })
  })
})
