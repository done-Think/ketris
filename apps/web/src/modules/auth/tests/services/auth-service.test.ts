import { describe, expect, it, vi } from 'vitest'

import { HttpClient } from '@shared/lib/api/http-client'
import { AuthService } from '../../services/auth-service'

describe('AuthService', () => {
  it('sends credentials through HttpClient without retrying an authentication failure as token refresh', async () => {
    const client = new HttpClient('/api')
    const response = { outcome: 'SELECT_TENANT', tenants: [] }
    const post = vi.spyOn(client, 'post').mockResolvedValue(response)
    await expect(
      new AuthService(client).login({
        email: 'ana@example.test',
        password: 'password',
        tenantId: '',
      }),
    ).resolves.toEqual(response)
    expect(post).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'ana@example.test', password: 'password' },
      { skipUnauthorizedHandling: true },
    )
  })

  it('preserves the selected tenant in the authentication payload', async () => {
    const client = new HttpClient('/api')
    const post = vi.spyOn(client, 'post').mockResolvedValue({})
    await new AuthService(client).login({
      email: 'ana@example.test',
      password: 'password',
      tenantId: 'tenant-2',
    })
    expect(post).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'ana@example.test', password: 'password', tenantId: 'tenant-2' },
      { skipUnauthorizedHandling: true },
    )
  })
})
