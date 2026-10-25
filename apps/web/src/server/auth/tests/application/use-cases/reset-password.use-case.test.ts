import { describe, expect, it, vi } from 'vitest'

import type { PasswordResetAccountRepository } from '../../../application/ports/password-reset-account-repository.port'
import type { PasswordHasher } from '../../../application/ports/password-hasher.port'
import type { PasswordResetTokenService } from '../../../application/ports/password-reset-token.port'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { ResetPasswordUseCase } from '../../../application/use-cases/reset-password.use-case'
import { InvalidPasswordResetTokenError } from '../../../domain/errors'
import type { User } from '../../../domain/user.entity'

const user: User = {
  id: 'user-2',
  tenantId: 'tenant-2',
  nome: 'Ana',
  email: 'ana@example.com',
  senhaHash: 'hash',
  papel: 'AGENT',
  ativo: false,
  vinculoAprovadoEm: null,
  emailVerifiedAt: null,
  tenantStatus: 'SUSPENDED',
  sessionVersion: 3,
}
function createDeps() {
  const users = {
    findById: vi.fn().mockResolvedValue(user),
    findByEmail: vi.fn(),
    update: vi.fn(),
  } as unknown as UserRepository
  const hasher: PasswordHasher = { hash: vi.fn().mockResolvedValue('new-hash'), compare: vi.fn() }
  const tokens: PasswordResetTokenService = {
    issue: vi.fn(),
    verify: vi.fn().mockResolvedValue({ userId: user.id, sessionVersion: 3 }),
  }
  const accounts: PasswordResetAccountRepository = {
    resetPassword: vi.fn().mockResolvedValue(true),
  }
  return {
    users,
    hasher,
    tokens,
    accounts,
    useCase: new ResetPasswordUseCase(users, hasher, accounts, tokens),
  }
}

describe('ResetPasswordUseCase', () => {
  it('resets only the token subject through atomic version check and session revocation, preserving account access state', async () => {
    const deps = createDeps()
    await deps.useCase.execute({
      email: ' ANA@EXAMPLE.COM ',
      password: 'new-password',
      resetToken: 'signed',
      tenantId: user.tenantId,
    })
    expect(deps.users.findById).toHaveBeenCalledWith(user.id)
    expect(deps.users.findByEmail).not.toHaveBeenCalled()
    expect(deps.accounts.resetPassword).toHaveBeenCalledWith({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      passwordHash: 'new-hash',
      sessionVersion: 3,
    })
    expect(deps.users.update).not.toHaveBeenCalled()
    expect(user.emailVerifiedAt).toBeNull()
    expect(user.ativo).toBe(false)
  })
  it.each([{ email: 'other@example.com' }, { tenantId: 'foreign' }])(
    'rejects mismatched email or tenant: %j',
    async (input) => {
      const deps = createDeps()
      await expect(
        deps.useCase.execute({
          email: user.email,
          password: 'new-password',
          resetToken: 'signed',
          ...input,
        }),
      ).rejects.toThrow(InvalidPasswordResetTokenError)
      expect(deps.hasher.hash).not.toHaveBeenCalled()
      expect(deps.accounts.resetPassword).not.toHaveBeenCalled()
    },
  )
  it('rejects token replay after session version changes', async () => {
    const deps = createDeps()
    vi.mocked(deps.users.findById).mockResolvedValue({ ...user, sessionVersion: 4 })
    await expect(
      deps.useCase.execute({ email: user.email, password: 'new-password', resetToken: 'signed' }),
    ).rejects.toThrow(InvalidPasswordResetTokenError)
    expect(deps.accounts.resetPassword).not.toHaveBeenCalled()
  })
  it('rejects a simultaneous reset if another request already claimed the version', async () => {
    const deps = createDeps()
    vi.mocked(deps.accounts.resetPassword).mockResolvedValue(false)
    await expect(
      deps.useCase.execute({ email: user.email, password: 'new-password', resetToken: 'signed' }),
    ).rejects.toThrow(InvalidPasswordResetTokenError)
  })
  it('rejects an invalid token before reading any account', async () => {
    const deps = createDeps()
    vi.mocked(deps.tokens.verify).mockRejectedValue(new InvalidPasswordResetTokenError())
    await expect(
      deps.useCase.execute({ email: user.email, password: 'new-password', resetToken: 'invalid' }),
    ).rejects.toThrow(InvalidPasswordResetTokenError)
    expect(deps.users.findById).not.toHaveBeenCalled()
  })
})
