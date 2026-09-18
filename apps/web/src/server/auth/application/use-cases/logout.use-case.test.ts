import { describe, expect, it, vi } from 'vitest'

import { hashRefreshToken } from '../../domain/refresh-token'
import type {
  RefreshTokenRepository,
  StoredRefreshToken,
} from '../ports/refresh-token-repository.port'
import { LogoutUseCase } from './logout.use-case'

const stored: StoredRefreshToken = { id: 'rt-1', userId: 'user-1', tenantId: 'tenant-1' }

function createDeps(overrides?: {
  findValidByTokenHash?: RefreshTokenRepository['findValidByTokenHash']
}) {
  const refreshTokenRepository: RefreshTokenRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    findValidByTokenHash: overrides?.findValidByTokenHash ?? vi.fn().mockResolvedValue(stored),
    revokeById: vi.fn().mockResolvedValue(undefined),
    revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  }

  return { refreshTokenRepository }
}

describe('LogoutUseCase', () => {
  it('revoga o refresh token quando ele existe e está válido', async () => {
    const deps = createDeps()
    const useCase = new LogoutUseCase(deps.refreshTokenRepository)

    await useCase.execute({ refreshToken: 'token-original' })

    expect(deps.refreshTokenRepository.revokeById).toHaveBeenCalledWith(stored.id)
  })

  it('procura pelo hash do token, nunca pelo valor em texto puro', async () => {
    const deps = createDeps()
    const useCase = new LogoutUseCase(deps.refreshTokenRepository)

    await useCase.execute({ refreshToken: 'token-original' })

    expect(deps.refreshTokenRepository.findValidByTokenHash).toHaveBeenCalledWith(
      hashRefreshToken('token-original'),
    )
  })

  it('não lança e não revoga nada quando o token já está inválido/expirado/revogado', async () => {
    const deps = createDeps({ findValidByTokenHash: vi.fn().mockResolvedValue(null) })
    const useCase = new LogoutUseCase(deps.refreshTokenRepository)

    await expect(useCase.execute({ refreshToken: 'token-invalido' })).resolves.toBeUndefined()
    expect(deps.refreshTokenRepository.revokeById).not.toHaveBeenCalled()
  })
})
