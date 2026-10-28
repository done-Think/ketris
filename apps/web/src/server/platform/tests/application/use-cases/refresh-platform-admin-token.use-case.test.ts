import { describe, expect, it, vi } from 'vitest'

import { InvalidPlatformRefreshTokenError } from '../../../domain/errors'
import type { PlatformAdmin } from '../../../types/platform-admin'
import { hashPlatformRefreshToken } from '../../../domain/refresh-token'
import type { PlatformAdminRepository } from '../../../application/ports/platform-admin-repository.port'
import type { PlatformRefreshTokenRepository } from '../../../application/ports/platform-refresh-token-repository.port'
import type { StoredPlatformRefreshToken } from '../../../types/platform-refresh-token-repository'
import type { PlatformTokenService } from '../../../application/ports/platform-token-service.port'
import { RefreshPlatformAdminTokenUseCase } from '../../../application/use-cases/refresh-platform-admin-token.use-case'

const admin: PlatformAdmin = {
  id: 'platform-admin-1',
  name: 'Dono Ketris',
  email: 'dono@ketris.dev',
  passwordHash: 'hash-fake',
  role: 'ADMIN',
  active: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  lastAccessAt: null,
}

const stored: StoredPlatformRefreshToken = { id: 'rt-1', platformAdminId: admin.id }

function createDeps(overrides?: {
  findValidByTokenHash?: PlatformRefreshTokenRepository['findValidByTokenHash']
  findById?: PlatformAdminRepository['findById']
}) {
  const platformAdminRepository: PlatformAdminRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(admin),
    findByEmail: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    recordAccess: vi.fn(),
  }
  const tokenService: PlatformTokenService = {
    sign: vi.fn().mockResolvedValue('jwt-novo'),
    verify: vi.fn(),
  }
  const refreshTokenRepository: PlatformRefreshTokenRepository = {
    rotate: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue(undefined),
    findValidByTokenHash: overrides?.findValidByTokenHash ?? vi.fn().mockResolvedValue(stored),
    revokeById: vi.fn().mockResolvedValue(undefined),
    revokeAllForPlatformAdmin: vi.fn().mockResolvedValue(undefined),
  }

  return { platformAdminRepository, tokenService, refreshTokenRepository }
}

describe('RefreshPlatformAdminTokenUseCase', () => {
  it('emite um novo access token e rotaciona o refresh token quando o token é válido', async () => {
    const deps = createDeps()
    const useCase = new RefreshPlatformAdminTokenUseCase(
      deps.platformAdminRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    const result = await useCase.execute({ refreshToken: 'token-original' })

    expect(result.accessToken).toBe('jwt-novo')
    expect(result.refreshToken).not.toBe('token-original')
    expect(deps.refreshTokenRepository.rotate).toHaveBeenCalledWith({
      previous: stored,
      replacement: expect.objectContaining({
        platformAdminId: admin.id,
        tokenHash: hashPlatformRefreshToken(result.refreshToken),
      }),
    })
    expect(deps.refreshTokenRepository.revokeById).not.toHaveBeenCalled()
    expect(deps.refreshTokenRepository.create).not.toHaveBeenCalled()
  })

  it('procura pelo hash do token, nunca pelo valor em texto puro', async () => {
    const deps = createDeps()
    const useCase = new RefreshPlatformAdminTokenUseCase(
      deps.platformAdminRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    await useCase.execute({ refreshToken: 'token-original' })

    expect(deps.refreshTokenRepository.findValidByTokenHash).toHaveBeenCalledWith(
      hashPlatformRefreshToken('token-original'),
    )
  })

  it('lança InvalidPlatformRefreshTokenError quando o token não é encontrado/expirado/revogado', async () => {
    const deps = createDeps({ findValidByTokenHash: vi.fn().mockResolvedValue(null) })
    const useCase = new RefreshPlatformAdminTokenUseCase(
      deps.platformAdminRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    await expect(useCase.execute({ refreshToken: 'token-invalido' })).rejects.toThrow(
      InvalidPlatformRefreshTokenError,
    )
    expect(deps.tokenService.sign).not.toHaveBeenCalled()
  })

  it('lança InvalidPlatformRefreshTokenError quando o admin do token está desativado', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue({ ...admin, active: false }) })
    const useCase = new RefreshPlatformAdminTokenUseCase(
      deps.platformAdminRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    await expect(useCase.execute({ refreshToken: 'token-original' })).rejects.toThrow(
      InvalidPlatformRefreshTokenError,
    )
    expect(deps.tokenService.sign).not.toHaveBeenCalled()
  })
  it('rejects replay when another request already consumed the refresh token', async () => {
    const deps = createDeps()
    vi.mocked(deps.refreshTokenRepository.rotate).mockResolvedValueOnce(false)
    const useCase = new RefreshPlatformAdminTokenUseCase(
      deps.platformAdminRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )
    await expect(useCase.execute({ refreshToken: 'token-original' })).rejects.toThrow(
      InvalidPlatformRefreshTokenError,
    )
    expect(deps.refreshTokenRepository.create).not.toHaveBeenCalled()
  })

  it('does not consume the old refresh token if signing fails', async () => {
    const deps = createDeps()
    vi.mocked(deps.tokenService.sign).mockRejectedValueOnce(new Error('signing unavailable'))
    const useCase = new RefreshPlatformAdminTokenUseCase(
      deps.platformAdminRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )
    await expect(useCase.execute({ refreshToken: 'token-original' })).rejects.toThrow(
      'signing unavailable',
    )
    expect(deps.refreshTokenRepository.rotate).not.toHaveBeenCalled()
    expect(deps.refreshTokenRepository.revokeById).not.toHaveBeenCalled()
  })

  it('propagates a failed transactional rotation without returning tokens', async () => {
    const deps = createDeps()
    vi.mocked(deps.refreshTokenRepository.rotate).mockRejectedValueOnce(
      new Error('write unavailable'),
    )
    const useCase = new RefreshPlatformAdminTokenUseCase(
      deps.platformAdminRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )
    await expect(useCase.execute({ refreshToken: 'token-original' })).rejects.toThrow(
      'write unavailable',
    )
  })
})
