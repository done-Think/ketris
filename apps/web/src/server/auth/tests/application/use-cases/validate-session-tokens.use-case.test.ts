import { describe, expect, it, vi } from 'vitest'

import type { RefreshTokenRepository } from '../../../application/ports/refresh-token-repository.port'
import type { TokenService } from '../../../application/ports/token-service.port'
import { ValidateSessionTokensUseCase } from '../../../application/use-cases/validate-session-tokens.use-case'
import { hashRefreshToken } from '../../../domain/refresh-token'

const claims = { sub: 'u1', tenantId: 't1', papel: 'AGENT' as const, sessionVersion: 2 }

function setup(stored: unknown = { id: 'r1', userId: 'u1', tenantId: 't1' }) {
  const tokens = { verify: vi.fn().mockResolvedValue(claims) } as unknown as TokenService
  const refreshTokens = {
    findValidByTokenHash: vi.fn().mockResolvedValue(stored),
  } as unknown as RefreshTokenRepository
  return { tokens, refreshTokens, useCase: new ValidateSessionTokensUseCase(tokens, refreshTokens) }
}

describe('ValidateSessionTokensUseCase', () => {
  it('requires a valid access token and matching active refresh token', async () => {
    const { useCase, tokens, refreshTokens } = setup()
    await expect(useCase.execute('access', 'refresh')).resolves.toEqual(claims)
    expect(tokens.verify).toHaveBeenCalledWith('access')
    expect(refreshTokens.findValidByTokenHash).toHaveBeenCalledWith(hashRefreshToken('refresh'))
  })

  it.each([
    null,
    { id: 'r1', userId: 'other-user', tenantId: 't1' },
    { id: 'r1', userId: 'u1', tenantId: 'other-tenant' },
  ])(
    'rejects revoked/expired tokens and tokens belonging to a different identity: %j',
    async (stored) => {
      await expect(setup(stored).useCase.execute('access', 'refresh')).rejects.toMatchObject({
        status: 401,
      })
    },
  )

  it('propagates access-validation failure before looking up a refresh token', async () => {
    const { useCase, tokens, refreshTokens } = setup()
    vi.mocked(tokens.verify).mockRejectedValueOnce(new Error('invalid access'))
    await expect(useCase.execute('access', 'refresh')).rejects.toThrow('invalid access')
    expect(refreshTokens.findValidByTokenHash).not.toHaveBeenCalled()
  })

  it('propagates database failures without converting them to invalid credentials', async () => {
    const { useCase, refreshTokens } = setup()
    vi.mocked(refreshTokens.findValidByTokenHash).mockRejectedValueOnce(
      new Error('database unavailable'),
    )
    await expect(useCase.execute('access', 'refresh')).rejects.toThrow('database unavailable')
  })
})
