import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../../domain/user.entity'
import type { PasswordResetCodeRepository } from '../../../application/ports/password-reset-code-repository.port'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { RequestPasswordResetCodeUseCase } from '../../../application/use-cases/request-password-reset-code.use-case'
import type { Mailer } from '@server/shared/email/mailer.port'

const user: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  nome: 'Ana Agente',
  email: 'ana@ketris.dev',
  senhaHash: 'hash',
  papel: 'AGENT',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

function createDeps(overrides?: { findByEmail?: UserRepository['findByEmail'] }) {
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(user),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const passwordResetCodeRepository: PasswordResetCodeRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    invalidateAllForUser: vi.fn().mockResolvedValue(undefined),
    findLatestActiveByUserId: vi.fn(),
    incrementAttempts: vi.fn(),
    consume: vi.fn(),
  }
  const mailer: Mailer = { send: vi.fn().mockResolvedValue(undefined) }

  return { userRepository, passwordResetCodeRepository, mailer }
}

describe('RequestPasswordResetCodeUseCase', () => {
  it('invalida códigos anteriores, cria um novo e envia por e-mail', async () => {
    const deps = createDeps()
    const useCase = new RequestPasswordResetCodeUseCase(
      deps.userRepository,
      deps.passwordResetCodeRepository,
      deps.mailer,
    )

    await useCase.execute({ email: 'ana@ketris.dev', locale: 'pt-BR' })

    expect(deps.passwordResetCodeRepository.invalidateAllForUser).toHaveBeenCalledWith(user.id)
    expect(deps.passwordResetCodeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id, tenantId: user.tenantId }),
    )
    expect(deps.mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: user.email, subject: expect.any(String) }),
    )
  })

  it('não lança e não envia e-mail quando o e-mail não existe (anti-enumeração)', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue(null) })
    const useCase = new RequestPasswordResetCodeUseCase(
      deps.userRepository,
      deps.passwordResetCodeRepository,
      deps.mailer,
    )

    await expect(
      useCase.execute({ email: 'desconhecido@ketris.dev', locale: 'pt-BR' }),
    ).resolves.toBeUndefined()

    expect(deps.passwordResetCodeRepository.create).not.toHaveBeenCalled()
    expect(deps.mailer.send).not.toHaveBeenCalled()
  })

  it('gera um código diferente a cada chamada', async () => {
    const deps = createDeps()
    const useCase = new RequestPasswordResetCodeUseCase(
      deps.userRepository,
      deps.passwordResetCodeRepository,
      deps.mailer,
    )

    await useCase.execute({ email: 'ana@ketris.dev', locale: 'pt-BR' })
    await useCase.execute({ email: 'ana@ketris.dev', locale: 'pt-BR' })

    const firstCodeHash = vi.mocked(deps.passwordResetCodeRepository.create).mock.calls[0]![0]
      .codeHash
    const secondCodeHash = vi.mocked(deps.passwordResetCodeRepository.create).mock.calls[1]![0]
      .codeHash

    expect(firstCodeHash).not.toBe(secondCodeHash)
  })
})
