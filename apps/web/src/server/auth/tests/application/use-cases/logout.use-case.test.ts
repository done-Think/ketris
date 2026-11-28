import { describe, expect, it, vi } from 'vitest'

import { hashRefreshToken } from '../../../domain/refresh-token'
import type {
  RefreshTokenRepository,
  StoredRefreshToken,
} from '../../../application/ports/refresh-token-repository.port'
import { LogoutUseCase } from '../../../application/use-cases/logout.use-case'

const stored: StoredRefreshToken = { id: 'rt-1', userId: 'user-1', tenantId: 'tenant-1' }

function createDeps(overrides?: {
  findValidByTokenHash?: RefreshTokenRepository['findValidByTokenHash']
}) {
  const refreshTokenRepository: RefreshTokenRepository = {
    rotate: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue(undefined),
    findValidByTokenHash: overrides?.findValidByTokenHash ?? vi.fn().mockResolvedValue(stored),
    findRecentlyRotatedByTokenHash: vi.fn().mockResolvedValue(null),
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

  it('revoga o token que substituiu um refresh token recém-rotacionado (cookie desatualizado)', async () => {
    const deps = createDeps({ findValidByTokenHash: vi.fn().mockResolvedValue(null) })
    vi.mocked(deps.refreshTokenRepository.findRecentlyRotatedByTokenHash).mockResolvedValue({
      ...stored,
      rotatedTo: 'rt-2',
    })

    await new LogoutUseCase(deps.refreshTokenRepository).execute({ refreshToken: 'antigo' })

    expect(deps.refreshTokenRepository.revokeById).toHaveBeenCalledWith('rt-2')
  })
})
