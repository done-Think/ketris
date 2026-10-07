import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../../domain/user.entity'
import { hashPasswordResetCode } from '../../../domain/password-reset-code'
import { InvalidPasswordResetCodeError } from '../../../domain/errors'
import type {
  PasswordResetCodeRepository,
  StoredPasswordResetCode,
} from '../../../application/ports/password-reset-code-repository.port'
import type { PasswordResetTokenService } from '../../../application/ports/password-reset-token.port'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { VerifyPasswordResetCodeUseCase } from '../../../application/use-cases/verify-password-reset-code.use-case'

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

const validCode = '123456'
const storedCode: StoredPasswordResetCode = {
  id: 'code-1',
  userId: user.id,
  codeHash: hashPasswordResetCode(validCode),
  attempts: 0,
  expiresAt: new Date(Date.now() + 60_000),
}

function createDeps(overrides?: {
  findByEmail?: UserRepository['findByEmail']
  findLatestActiveByUserId?: PasswordResetCodeRepository['findLatestActiveByUserId']
}) {
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
    create: vi.fn(),
    invalidateAllForUser: vi.fn(),
    findLatestActiveByUserId:
      overrides?.findLatestActiveByUserId ?? vi.fn().mockResolvedValue(storedCode),
    incrementAttempts: vi.fn().mockResolvedValue(undefined),
    consume: vi.fn().mockResolvedValue(undefined),
  }
  const passwordResetTokenService: PasswordResetTokenService = {
    issue: vi.fn().mockResolvedValue('reset-token-assinado'),
    verify: vi.fn(),
  }

  return { userRepository, passwordResetCodeRepository, passwordResetTokenService }
}

describe('VerifyPasswordResetCodeUseCase', () => {
  it('consome o código e emite um resetToken quando o código bate', async () => {
    const deps = createDeps()
    const useCase = new VerifyPasswordResetCodeUseCase(
      deps.userRepository,
      deps.passwordResetCodeRepository,
      deps.passwordResetTokenService,
    )

    const result = await useCase.execute({ email: 'ana@ketris.dev', code: validCode })

    expect(result).toEqual({ resetToken: 'reset-token-assinado' })
    expect(deps.passwordResetCodeRepository.consume).toHaveBeenCalledWith(storedCode.id)
    expect(deps.passwordResetTokenService.issue).toHaveBeenCalledWith(user.id)
  })

  it('lança InvalidPasswordResetCodeError e incrementa tentativas quando o código está errado', async () => {
    const deps = createDeps()
    const useCase = new VerifyPasswordResetCodeUseCase(
      deps.userRepository,
      deps.passwordResetCodeRepository,
      deps.passwordResetTokenService,
    )

    await expect(useCase.execute({ email: 'ana@ketris.dev', code: '000000' })).rejects.toThrow(
      InvalidPasswordResetCodeError,
    )

    expect(deps.passwordResetCodeRepository.incrementAttempts).toHaveBeenCalledWith(storedCode.id)
    expect(deps.passwordResetTokenService.issue).not.toHaveBeenCalled()
  })

  it('lança InvalidPasswordResetCodeError quando não há código ativo (expirado ou nunca pedido)', async () => {
    const deps = createDeps({ findLatestActiveByUserId: vi.fn().mockResolvedValue(null) })
    const useCase = new VerifyPasswordResetCodeUseCase(
      deps.userRepository,
      deps.passwordResetCodeRepository,
      deps.passwordResetTokenService,
    )

    await expect(useCase.execute({ email: 'ana@ketris.dev', code: validCode })).rejects.toThrow(
      InvalidPasswordResetCodeError,
    )
  })

  it('lança InvalidPasswordResetCodeError e consome o código quando as tentativas já se esgotaram', async () => {
    const deps = createDeps({
      findLatestActiveByUserId: vi.fn().mockResolvedValue({ ...storedCode, attempts: 5 }),
    })
    const useCase = new VerifyPasswordResetCodeUseCase(
      deps.userRepository,
      deps.passwordResetCodeRepository,
      deps.passwordResetTokenService,
    )

    await expect(useCase.execute({ email: 'ana@ketris.dev', code: validCode })).rejects.toThrow(
      InvalidPasswordResetCodeError,
    )

    expect(deps.passwordResetCodeRepository.consume).toHaveBeenCalledWith(storedCode.id)
  })

  it('lança InvalidPasswordResetCodeError quando o e-mail não existe (anti-enumeração)', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue(null) })
    const useCase = new VerifyPasswordResetCodeUseCase(
      deps.userRepository,
      deps.passwordResetCodeRepository,
      deps.passwordResetTokenService,
    )

    await expect(
      useCase.execute({ email: 'desconhecido@ketris.dev', code: validCode }),
    ).rejects.toThrow(InvalidPasswordResetCodeError)
  })
})
