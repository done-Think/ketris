import { describe, expect, it, vi } from 'vitest'

import type { PlatformAdminRepository } from '../../../application/ports/platform-admin-repository.port'
import type { PlatformRefreshTokenRepository } from '../../../application/ports/platform-refresh-token-repository.port'
import type { PlatformTokenService } from '../../../application/ports/platform-token-service.port'
import { ValidatePlatformSessionTokensUseCase } from '../../../application/use-cases/validate-platform-session-tokens.use-case'
import { LogoutPlatformAdminUseCase } from '../../../application/use-cases/logout-platform-admin.use-case'
import { hashPlatformRefreshToken } from '../../../domain/refresh-token'

function setup() {
  const tokens = {
    verify: vi.fn().mockResolvedValue({ sub: 'p1', scope: 'platform' }),
  } as unknown as PlatformTokenService
  const admins = {
    findById: vi.fn().mockResolvedValue({ id: 'p1', ativo: true }),
  } as unknown as PlatformAdminRepository
  const refreshTokens = {
    findValidByTokenHash: vi.fn().mockResolvedValue({ id: 'r1', platformAdminId: 'p1' }),
    revokeById: vi.fn().mockResolvedValue(undefined),
  } as unknown as PlatformRefreshTokenRepository
  return {
    tokens,
    admins,
    refreshTokens,
    useCase: new ValidatePlatformSessionTokensUseCase(tokens, admins, refreshTokens),
  }
}

describe('platform session token validation', () => {
  it('validates the signed token, active admin, and ownership of the hashed refresh token', async () => {
    const { useCase, refreshTokens } = setup()
    await expect(useCase.execute('access', 'refresh')).resolves.toEqual({
      sub: 'p1',
      scope: 'platform',
    })
    expect(refreshTokens.findValidByTokenHash).toHaveBeenCalledWith(
      hashPlatformRefreshToken('refresh'),
    )
  })

  it.each([null, { id: 'r1', platformAdminId: 'other-admin' }])(
    'rejects invalid or foreign refresh tokens',
    async (stored) => {
      const { useCase, refreshTokens } = setup()
      vi.mocked(refreshTokens.findValidByTokenHash).mockResolvedValueOnce(stored)
      await expect(useCase.execute('access', 'refresh')).rejects.toMatchObject({ status: 401 })
    },
  )

  it('rejects a deactivated administrator', async () => {
    const { useCase, admins } = setup()
    vi.mocked(admins.findById).mockResolvedValueOnce(null)
    await expect(useCase.execute('access', 'refresh')).rejects.toMatchObject({ status: 401 })
  })

  it('propagates infrastructure errors', async () => {
    const { useCase, admins } = setup()
    vi.mocked(admins.findById).mockRejectedValueOnce(new Error('database unavailable'))
    await expect(useCase.execute('access', 'refresh')).rejects.toThrow('database unavailable')
  })
})

describe('platform logout', () => {
  it('revokes the matching refresh token without storing plaintext', async () => {
    const { refreshTokens } = setup()
    await new LogoutPlatformAdminUseCase(refreshTokens).execute('refresh')
    expect(refreshTokens.findValidByTokenHash).toHaveBeenCalledWith(
      hashPlatformRefreshToken('refresh'),
    )
    expect(refreshTokens.revokeById).toHaveBeenCalledWith('r1')
  })

  it('is idempotent for invalid, expired, or already revoked tokens', async () => {
    const { refreshTokens } = setup()
    vi.mocked(refreshTokens.findValidByTokenHash).mockResolvedValueOnce(null)
    await new LogoutPlatformAdminUseCase(refreshTokens).execute('refresh')
    expect(refreshTokens.revokeById).not.toHaveBeenCalled()
  })
})
