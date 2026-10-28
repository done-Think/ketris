import { describe, expect, it, vi } from 'vitest'

import { InvalidRefreshTokenError } from '../../../domain/errors'
import { hashRefreshToken } from '../../../domain/refresh-token'
import type { User } from '../../../domain/user.entity'
import type {
  RefreshTokenRepository,
  StoredRefreshToken,
} from '../../../application/ports/refresh-token-repository.port'
import type { TokenService } from '../../../application/ports/token-service.port'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { RefreshAccessTokenUseCase } from '../../../application/use-cases/refresh-access-token.use-case'

const user: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Ana Agente',
  email: 'ana@ketris.dev',
  passwordHash: 'hash-fake',
  role: 'AGENT',
  active: true,
  membershipApprovedAt: new Date(),
}

const stored: StoredRefreshToken = { id: 'rt-1', userId: user.id, tenantId: user.tenantId }

function createDeps(overrides?: {
  findValidByTokenHash?: RefreshTokenRepository['findValidByTokenHash']
  findById?: UserRepository['findById']
}) {
  const userRepository: UserRepository = {
    findManyByEmail: vi.fn(),

    findById: overrides?.findById ?? vi.fn().mockResolvedValue(user),
    findByEmail: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const tokenService: TokenService = {
    sign: vi.fn().mockResolvedValue('jwt-novo'),
    verify: vi.fn(),
  }
  const refreshTokenRepository: RefreshTokenRepository = {
    rotate: vi.fn().mockResolvedValue(true),
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
    expect(deps.refreshTokenRepository.rotate).toHaveBeenCalledWith({
      previous: stored,
      expectedSessionVersion: user.sessionVersion ?? 0,
      replacement: expect.objectContaining({
        userId: user.id,
        tenantId: user.tenantId,
        tokenHash: hashRefreshToken(result.refreshToken),
      }),
    })
    expect(deps.refreshTokenRepository.revokeById).not.toHaveBeenCalled()
    expect(deps.refreshTokenRepository.create).not.toHaveBeenCalled()
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
    const deps = createDeps({ findById: vi.fn().mockResolvedValue({ ...user, active: false }) })
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
  it('rejects replay when another request already consumed the refresh token', async () => {
    const deps = createDeps()
    vi.mocked(deps.refreshTokenRepository.rotate).mockResolvedValueOnce(false)
    const useCase = new RefreshAccessTokenUseCase(
      deps.userRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )
    await expect(useCase.execute({ refreshToken: 'token-original' })).rejects.toThrow(
      InvalidRefreshTokenError,
    )
    expect(deps.refreshTokenRepository.create).not.toHaveBeenCalled()
  })

  it('does not consume the old refresh token if signing fails', async () => {
    const deps = createDeps()
    vi.mocked(deps.tokenService.sign).mockRejectedValueOnce(new Error('signing unavailable'))
    const useCase = new RefreshAccessTokenUseCase(
      deps.userRepository,
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
    const useCase = new RefreshAccessTokenUseCase(
      deps.userRepository,
      deps.tokenService,
      deps.refreshTokenRepository,
    )
    await expect(useCase.execute({ refreshToken: 'token-original' })).rejects.toThrow(
      'write unavailable',
    )
  })
})
