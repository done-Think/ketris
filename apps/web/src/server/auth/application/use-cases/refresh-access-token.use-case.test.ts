import { describe, expect, it, vi } from 'vitest'

import { InvalidRefreshTokenError } from '../../domain/errors'
import { hashRefreshToken } from '../../domain/refresh-token'
import type { User } from '../../domain/user.entity'
import type {
  RefreshTokenRepository,
  StoredRefreshToken,
} from '../ports/refresh-token-repository.port'
import type { TokenService } from '../ports/token-service.port'
import type { UserRepository } from '../ports/user-repository.port'
import { RefreshAccessTokenUseCase } from './refresh-access-token.use-case'

const user: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  nome: 'Ana Agente',
  email: 'ana@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'AGENT',
  ativo: true,
}

const stored: StoredRefreshToken = { id: 'rt-1', userId: user.id, tenantId: user.tenantId }

function createDeps(overrides?: {
  findValidByTokenHash?: RefreshTokenRepository['findValidByTokenHash']
  findById?: UserRepository['findById']
}) {
  const userRepository: UserRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(user),
    findByEmail: vi.fn(),
    findByEmailAndTenant: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  }
  const tokenService: TokenService = {
    sign: vi.fn().mockResolvedValue('jwt-novo'),
    verify: vi.fn(),
  }
  const refreshTokenRepository: RefreshTokenRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    findValidByTokenHash: overrides?.findValidByTokenHash ?? vi.fn().mockResolvedValue(stored),
    revokeById: vi.fn().mockResolvedValue(undefined),
    revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  }

  return { userRepository, tokenService, refreshTokenRepository }
}

describe('RefreshAccessTokenUseCase', () => {
  it('emite um novo access token e rotaciona o refresh token quando o token é válido', async () => {
    const deps = createDeps()
    const useCase = new RefreshAccessTokenUseCase(
      deps.userRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    const result = await useCase.execute({ refreshToken: 'token-original' })

    expect(result.accessToken).toBe('jwt-novo')
    expect(typeof result.refreshToken).toBe('string')
    expect(result.refreshToken).not.toBe('token-original')
    expect(deps.refreshTokenRepository.revokeById).toHaveBeenCalledWith(stored.id)
    expect(deps.refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id, tenantId: user.tenantId }),
    )
  })

  it('procura pelo hash do token, nunca pelo valor em texto puro', async () => {
    const deps = createDeps()
    const useCase = new RefreshAccessTokenUseCase(
      deps.userRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    await useCase.execute({ refreshToken: 'token-original' })

    expect(deps.refreshTokenRepository.findValidByTokenHash).toHaveBeenCalledWith(
      hashRefreshToken('token-original'),
    )
  })

  it('lança InvalidRefreshTokenError quando o token não é encontrado/está expirado/revogado', async () => {
    const deps = createDeps({ findValidByTokenHash: vi.fn().mockResolvedValue(null) })
    const useCase = new RefreshAccessTokenUseCase(
      deps.userRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    await expect(useCase.execute({ refreshToken: 'token-invalido' })).rejects.toThrow(
      InvalidRefreshTokenError,
    )
    expect(deps.tokenService.sign).not.toHaveBeenCalled()
    expect(deps.refreshTokenRepository.revokeById).not.toHaveBeenCalled()
  })

  it('lança InvalidRefreshTokenError quando o usuário do token não existe mais', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new RefreshAccessTokenUseCase(
      deps.userRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    await expect(useCase.execute({ refreshToken: 'token-original' })).rejects.toThrow(
      InvalidRefreshTokenError,
    )
    expect(deps.tokenService.sign).not.toHaveBeenCalled()
  })

  it('lança InvalidRefreshTokenError quando o usuário do token está desativado', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue({ ...user, ativo: false }) })
    const useCase = new RefreshAccessTokenUseCase(
      deps.userRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    await expect(useCase.execute({ refreshToken: 'token-original' })).rejects.toThrow(
      InvalidRefreshTokenError,
    )
    expect(deps.tokenService.sign).not.toHaveBeenCalled()
    expect(deps.refreshTokenRepository.revokeById).not.toHaveBeenCalled()
  })
})
