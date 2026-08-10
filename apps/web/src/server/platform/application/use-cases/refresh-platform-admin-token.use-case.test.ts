import { describe, expect, it, vi } from 'vitest'

import { InvalidPlatformRefreshTokenError } from '../../domain/errors'
import type { PlatformAdmin } from '../../domain/platform-admin.entity'
import { hashPlatformRefreshToken } from '../../domain/refresh-token'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type {
  PlatformRefreshTokenRepository,
  StoredPlatformRefreshToken,
} from '../ports/platform-refresh-token-repository.port'
import type { PlatformTokenService } from '../ports/platform-token-service.port'
import { RefreshPlatformAdminTokenUseCase } from './refresh-platform-admin-token.use-case'

const admin: PlatformAdmin = {
  id: 'platform-admin-1',
  nome: 'Dono Ketris',
  email: 'dono@ketris.dev',
  senhaHash: 'hash-fake',
  ativo: true,
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
  }
  const tokenService: PlatformTokenService = {
    sign: vi.fn().mockResolvedValue('jwt-novo'),
    verify: vi.fn(),
  }
  const refreshTokenRepository: PlatformRefreshTokenRepository = {
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
    expect(deps.refreshTokenRepository.revokeById).toHaveBeenCalledWith(stored.id)
    expect(deps.refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ platformAdminId: admin.id }),
    )
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
    const deps = createDeps({ findById: vi.fn().mockResolvedValue({ ...admin, ativo: false }) })
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
})
