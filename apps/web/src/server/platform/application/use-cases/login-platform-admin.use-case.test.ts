import { describe, expect, it, vi } from 'vitest'

import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'

import { InvalidPlatformCredentialsError } from '../../domain/errors'
import type { PlatformAdmin } from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type { PlatformRefreshTokenRepository } from '../ports/platform-refresh-token-repository.port'
import type { PlatformTokenService } from '../ports/platform-token-service.port'
import { LoginPlatformAdminUseCase } from './login-platform-admin.use-case'

const admin: PlatformAdmin = {
  id: 'platform-admin-1',
  nome: 'Dono Ketris',
  email: 'dono@ketris.dev',
  senhaHash: 'hash-fake',
  ativo: true,
}

function createDeps(overrides?: {
  findByEmail?: PlatformAdminRepository['findByEmail']
  compare?: PasswordHasher['compare']
}) {
  const platformAdminRepository: PlatformAdminRepository = {
    findById: vi.fn().mockResolvedValue(admin),
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(admin),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  }
  const passwordHasher: PasswordHasher = {
    compare: overrides?.compare ?? vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }
  const tokenService: PlatformTokenService = {
    sign: vi.fn().mockResolvedValue('jwt-fake'),
    verify: vi.fn(),
  }
  const refreshTokenRepository: PlatformRefreshTokenRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    findValidByTokenHash: vi.fn(),
    revokeById: vi.fn(),
    revokeAllForPlatformAdmin: vi.fn(),
  }

  return { platformAdminRepository, passwordHasher, tokenService, refreshTokenRepository }
}

function buildUseCase(deps: ReturnType<typeof createDeps>): LoginPlatformAdminUseCase {
  return new LoginPlatformAdminUseCase(
    deps.platformAdminRepository,
    deps.passwordHasher,
    deps.tokenService,
    deps.refreshTokenRepository,
  )
}

describe('LoginPlatformAdminUseCase', () => {
  it('retorna admin autenticado (sem senhaHash), access token e refresh token em credenciais válidas', async () => {
    const deps = createDeps()
    const useCase = buildUseCase(deps)

    const result = await useCase.execute({ email: admin.email, password: 'senha-correta' })

    expect(result.accessToken).toBe('jwt-fake')
    expect(typeof result.refreshToken).toBe('string')
    expect(result.refreshToken.length).toBeGreaterThan(32)
    expect(result.admin).toEqual({
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      ativo: admin.ativo,
    })
    expect(result.admin).not.toHaveProperty('senhaHash')
  })

  it('persiste o hash do refresh token com platformAdminId/expiresAt', async () => {
    const deps = createDeps()
    const useCase = buildUseCase(deps)

    const result = await useCase.execute({ email: admin.email, password: 'senha-correta' })

    const call = vi.mocked(deps.refreshTokenRepository.create).mock.calls[0][0]
    expect(call.platformAdminId).toBe(admin.id)
    expect(call.tokenHash).not.toBe(result.refreshToken)
    expect(call.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('lança InvalidPlatformCredentialsError quando o admin não existe', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue(null) })
    const useCase = buildUseCase(deps)

    await expect(
      useCase.execute({ email: 'inexistente@ketris.dev', password: 'x' }),
    ).rejects.toThrow(InvalidPlatformCredentialsError)
    expect(deps.tokenService.sign).not.toHaveBeenCalled()
  })

  it('lança InvalidPlatformCredentialsError quando a senha não confere', async () => {
    const deps = createDeps({ compare: vi.fn().mockResolvedValue(false) })
    const useCase = buildUseCase(deps)

    await expect(useCase.execute({ email: admin.email, password: 'senha-errada' })).rejects.toThrow(
      InvalidPlatformCredentialsError,
    )
  })

  it('lança InvalidPlatformCredentialsError quando o admin está desativado', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue({ ...admin, ativo: false }) })
    const useCase = buildUseCase(deps)

    await expect(
      useCase.execute({ email: admin.email, password: 'senha-correta' }),
    ).rejects.toThrow(InvalidPlatformCredentialsError)
    expect(deps.passwordHasher.compare).not.toHaveBeenCalled()
  })
})
