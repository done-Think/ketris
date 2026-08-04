import { describe, expect, it, vi } from 'vitest'

import { InvalidCredentialsError } from '../../domain/errors'
import type { User } from '../../domain/user.entity'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { TokenService } from '../ports/token-service.port'
import type { UserRepository } from '../ports/user-repository.port'
import { LoginUseCase } from './login.use-case'

const user: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  nome: 'Ana Corretora',
  email: 'ana@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'CORRETOR',
}

function createDeps(overrides?: {
  findByEmail?: UserRepository['findByEmail']
  compare?: PasswordHasher['compare']
}) {
  const userRepository: UserRepository = {
    findById: vi.fn().mockResolvedValue(user),
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(user),
    findByEmailAndTenant: vi.fn().mockResolvedValue(user),
    create: vi.fn().mockResolvedValue(user),
  }
  const passwordHasher: PasswordHasher = {
    compare: overrides?.compare ?? vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }
  const tokenService: TokenService = {
    sign: vi.fn().mockResolvedValue('jwt-fake'),
    verify: vi.fn(),
  }
  const refreshTokenRepository: RefreshTokenRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    findValidByTokenHash: vi.fn(),
    revokeById: vi.fn(),
  }

  return { userRepository, passwordHasher, tokenService, refreshTokenRepository }
}

function buildUseCase(deps: ReturnType<typeof createDeps>): LoginUseCase {
  return new LoginUseCase(
    deps.userRepository,
    deps.passwordHasher,
    deps.tokenService,
    deps.refreshTokenRepository,
  )
}

describe('LoginUseCase', () => {
  it('retorna usuário autenticado (sem senhaHash), access token e refresh token em credenciais válidas', async () => {
    const deps = createDeps()
    const useCase = buildUseCase(deps)

    const result = await useCase.execute({ email: user.email, password: 'senha-correta' })

    expect(result.accessToken).toBe('jwt-fake')
    expect(typeof result.refreshToken).toBe('string')
    expect(result.refreshToken.length).toBeGreaterThan(32)
    expect(result.user).toEqual({
      id: user.id,
      tenantId: user.tenantId,
      nome: user.nome,
      email: user.email,
      papel: user.papel,
    })
    expect(result.user).not.toHaveProperty('senhaHash')
    expect(deps.tokenService.sign).toHaveBeenCalledWith(result.user)
  })

  it('persiste o hash do refresh token (não o valor em texto puro) com userId/tenantId/expiresAt', async () => {
    const deps = createDeps()
    const useCase = buildUseCase(deps)

    const result = await useCase.execute({ email: user.email, password: 'senha-correta' })

    expect(deps.refreshTokenRepository.create).toHaveBeenCalledTimes(1)
    const call = vi.mocked(deps.refreshTokenRepository.create).mock.calls[0][0]
    expect(call.userId).toBe(user.id)
    expect(call.tenantId).toBe(user.tenantId)
    expect(call.tokenHash).not.toBe(result.refreshToken)
    expect(call.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('lança InvalidCredentialsError quando o usuário não existe', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue(null) })
    const useCase = buildUseCase(deps)

    await expect(
      useCase.execute({ email: 'inexistente@ketris.dev', password: 'x' }),
    ).rejects.toThrow(InvalidCredentialsError)
    expect(deps.tokenService.sign).not.toHaveBeenCalled()
    expect(deps.refreshTokenRepository.create).not.toHaveBeenCalled()
  })

  it('lança InvalidCredentialsError (mensagem genérica) quando a senha não confere', async () => {
    const deps = createDeps({ compare: vi.fn().mockResolvedValue(false) })
    const useCase = buildUseCase(deps)

    await expect(useCase.execute({ email: user.email, password: 'senha-errada' })).rejects.toThrow(
      InvalidCredentialsError,
    )
    expect(deps.tokenService.sign).not.toHaveBeenCalled()
    expect(deps.refreshTokenRepository.create).not.toHaveBeenCalled()
  })

  it('não vaza qual campo (e-mail ou senha) estava errado — mesma mensagem em ambos os casos', async () => {
    const semUsuario = buildUseCase(createDeps({ findByEmail: vi.fn().mockResolvedValue(null) }))
    const senhaErrada = buildUseCase(createDeps({ compare: vi.fn().mockResolvedValue(false) }))

    const capture = async (promise: Promise<unknown>): Promise<Error> => {
      try {
        await promise
        throw new Error('esperava que a promise rejeitasse, mas ela resolveu')
      } catch (error) {
        return error as Error
      }
    }

    const [erro1, erro2] = await Promise.all([
      capture(semUsuario.execute({ email: 'x@x.com', password: 'x' })),
      capture(senhaErrada.execute({ email: user.email, password: 'x' })),
    ])

    expect(erro1.message).toBe(erro2.message)
  })
})
