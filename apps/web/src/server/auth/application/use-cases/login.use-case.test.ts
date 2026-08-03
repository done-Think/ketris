import { describe, expect, it, vi } from 'vitest'

import { InvalidCredentialsError } from '../../domain/errors'
import type { User } from '../../domain/user.entity'
import type { PasswordHasher } from '../ports/password-hasher.port'
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

// Fakes simples dos ports — sem framework de mock, só objetos que implementam a interface. Mantém o
// teste desacoplado de bcrypt/jose/Prisma reais (isolamento de unidade).
function createDeps(overrides?: {
  findByEmail?: UserRepository['findByEmail']
  compare?: PasswordHasher['compare']
}) {
  const userRepository: UserRepository = {
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(user),
  }
  const passwordHasher: PasswordHasher = {
    compare: overrides?.compare ?? vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }
  const tokenService: TokenService = {
    sign: vi.fn().mockResolvedValue('jwt-fake'),
    verify: vi.fn(),
  }

  return { userRepository, passwordHasher, tokenService }
}

describe('LoginUseCase', () => {
  it('retorna usuário autenticado (sem senhaHash) e access token em credenciais válidas', async () => {
    const deps = createDeps()
    const useCase = new LoginUseCase(deps.userRepository, deps.passwordHasher, deps.tokenService)

    const result = await useCase.execute({ email: user.email, password: 'senha-correta' })

    expect(result.accessToken).toBe('jwt-fake')
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

  it('lança InvalidCredentialsError quando o usuário não existe', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue(null) })
    const useCase = new LoginUseCase(deps.userRepository, deps.passwordHasher, deps.tokenService)

    await expect(
      useCase.execute({ email: 'inexistente@ketris.dev', password: 'x' }),
    ).rejects.toThrow(InvalidCredentialsError)
    expect(deps.tokenService.sign).not.toHaveBeenCalled()
  })

  it('lança InvalidCredentialsError (mensagem genérica) quando a senha não confere', async () => {
    const deps = createDeps({ compare: vi.fn().mockResolvedValue(false) })
    const useCase = new LoginUseCase(deps.userRepository, deps.passwordHasher, deps.tokenService)

    await expect(useCase.execute({ email: user.email, password: 'senha-errada' })).rejects.toThrow(
      InvalidCredentialsError,
    )
    expect(deps.tokenService.sign).not.toHaveBeenCalled()
  })

  it('não vaza qual campo (e-mail ou senha) estava errado — mesma mensagem em ambos os casos', async () => {
    const semUsuario = createDeps({ findByEmail: vi.fn().mockResolvedValue(null) })
    const senhaErrada = createDeps({ compare: vi.fn().mockResolvedValue(false) })

    const useCase1 = new LoginUseCase(
      semUsuario.userRepository,
      semUsuario.passwordHasher,
      semUsuario.tokenService,
    )
    const useCase2 = new LoginUseCase(
      senhaErrada.userRepository,
      senhaErrada.passwordHasher,
      senhaErrada.tokenService,
    )

    const capture = async (promise: Promise<unknown>): Promise<Error> => {
      try {
        await promise
        throw new Error('esperava que a promise rejeitasse, mas ela resolveu')
      } catch (error) {
        return error as Error
      }
    }

    const [erro1, erro2] = await Promise.all([
      capture(useCase1.execute({ email: 'x@x.com', password: 'x' })),
      capture(useCase2.execute({ email: user.email, password: 'x' })),
    ])

    expect(erro1.message).toBe(erro2.message)
  })
})
