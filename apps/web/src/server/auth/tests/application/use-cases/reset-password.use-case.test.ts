import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../../domain/user.entity'
import { InvalidPasswordResetTokenError } from '../../../domain/errors'
import type { PasswordHasher } from '../../../application/ports/password-hasher.port'
import type { PasswordResetTokenService } from '../../../application/ports/password-reset-token.port'
import type { RefreshTokenRepository } from '../../../application/ports/refresh-token-repository.port'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { ResetPasswordUseCase } from '../../../application/use-cases/reset-password.use-case'

const user: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  nome: 'Ana Agente',
  email: 'ana@ketris.dev',
  senhaHash: 'hash-antigo',
  papel: 'AGENT',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

function createDeps(overrides?: {
  findByEmail?: UserRepository['findByEmail']
  verifyResetToken?: PasswordResetTokenService['verify']
}) {
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(user),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(user),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const passwordHasher: PasswordHasher = {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }
  const refreshTokenRepository: RefreshTokenRepository = {
    create: vi.fn(),
    findValidByTokenHash: vi.fn(),
    revokeById: vi.fn(),
    revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  }
  const passwordResetTokenService: PasswordResetTokenService = {
    issue: vi.fn(),
    verify: overrides?.verifyResetToken ?? vi.fn().mockResolvedValue(user.id),
  }

  return { userRepository, passwordHasher, refreshTokenRepository, passwordResetTokenService }
}

describe('ResetPasswordUseCase', () => {
  it('atualiza o hash da senha e revoga todos os refresh tokens do usuário', async () => {
    const deps = createDeps()
    const useCase = new ResetPasswordUseCase(
      deps.userRepository,
      deps.passwordHasher,
      deps.refreshTokenRepository,
      deps.passwordResetTokenService,
    )

    await useCase.execute({
      email: 'ana@ketris.dev',
      password: 'nova-senha-123',
      resetToken: 'token-valido',
    })

    expect(deps.passwordResetTokenService.verify).toHaveBeenCalledWith('token-valido')
    expect(deps.passwordHasher.hash).toHaveBeenCalledWith('nova-senha-123')
    expect(deps.userRepository.update).toHaveBeenCalledWith(user.id, { senhaHash: 'hash-novo' })
    expect(deps.refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(user.id)
  })

  it('não lança e não faz nada quando o e-mail não existe (anti-enumeração)', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue(null) })
    const useCase = new ResetPasswordUseCase(
      deps.userRepository,
      deps.passwordHasher,
      deps.refreshTokenRepository,
      deps.passwordResetTokenService,
    )

    await expect(
      useCase.execute({
        email: 'desconhecido@ketris.dev',
        password: 'nova-senha-123',
        resetToken: 'token-qualquer',
      }),
    ).resolves.toBeUndefined()

    expect(deps.passwordResetTokenService.verify).not.toHaveBeenCalled()
    expect(deps.passwordHasher.hash).not.toHaveBeenCalled()
    expect(deps.userRepository.update).not.toHaveBeenCalled()
    expect(deps.refreshTokenRepository.revokeAllForUser).not.toHaveBeenCalled()
  })

  it('lança InvalidPasswordResetTokenError quando o token é inválido/expirado', async () => {
    const deps = createDeps({
      verifyResetToken: vi.fn().mockRejectedValue(new InvalidPasswordResetTokenError()),
    })
    const useCase = new ResetPasswordUseCase(
      deps.userRepository,
      deps.passwordHasher,
      deps.refreshTokenRepository,
      deps.passwordResetTokenService,
    )

    await expect(
      useCase.execute({
        email: 'ana@ketris.dev',
        password: 'nova-senha-123',
        resetToken: 'token-invalido',
      }),
    ).rejects.toThrow(InvalidPasswordResetTokenError)

    expect(deps.userRepository.update).not.toHaveBeenCalled()
  })

  it('lança InvalidPasswordResetTokenError quando o token prova outro usuário', async () => {
    const deps = createDeps({ verifyResetToken: vi.fn().mockResolvedValue('outro-usuario') })
    const useCase = new ResetPasswordUseCase(
      deps.userRepository,
      deps.passwordHasher,
      deps.refreshTokenRepository,
      deps.passwordResetTokenService,
    )

    await expect(
      useCase.execute({
        email: 'ana@ketris.dev',
        password: 'nova-senha-123',
        resetToken: 'token-de-outro-usuario',
      }),
    ).rejects.toThrow(InvalidPasswordResetTokenError)

    expect(deps.userRepository.update).not.toHaveBeenCalled()
  })
})
