import { describe, expect, it, vi } from 'vitest'

import type { EmailOwnershipCodeRepository } from '../../../application/ports/email-ownership-code-repository.port'
import type { PasswordResetTokenService } from '../../../application/ports/password-reset-token.port'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { VerifyPasswordResetCodeUseCase } from '../../../application/use-cases/verify-password-reset-code.use-case'
import { InvalidPasswordResetCodeError } from '../../../domain/errors'
import { hashPasswordResetCode } from '../../../domain/password-reset-code'
import type { User } from '../../../domain/user.entity'

const user: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  tenantName: 'Account one',
  tenantSlug: 'one',
  name: 'Ana',
  email: 'ana@example.com',
  passwordHash: 'hash',
  role: 'AGENT',
  active: true,
  membershipApprovedAt: new Date(),
  sessionVersion: 3,
}
const second: User = {
  ...user,
  id: 'user-2',
  tenantId: 'tenant-2',
  tenantName: 'Account two',
  tenantSlug: 'two',
  sessionVersion: 5,
}
function createDeps() {
  const users = {
    findManyByEmail: vi.fn().mockResolvedValue([user]),
    findByEmail: vi.fn(),
  } as unknown as UserRepository
  const codes: EmailOwnershipCodeRepository = {
    replace: vi.fn(),
    verify: vi.fn().mockResolvedValue(true),
  }
  const tokens: PasswordResetTokenService = {
    issue: vi.fn().mockResolvedValue('reset-token'),
    verify: vi.fn(),
  }
  return { users, codes, tokens, useCase: new VerifyPasswordResetCodeUseCase(users, codes, tokens) }
}

describe('VerifyPasswordResetCodeUseCase', () => {
  it('never queries or reveals accounts before proving mailbox ownership', async () => {
    const deps = createDeps()
    vi.mocked(deps.codes.verify).mockResolvedValue(false)
    await expect(deps.useCase.execute({ email: user.email, code: '000000' })).rejects.toThrow(
      InvalidPasswordResetCodeError,
    )
    expect(deps.users.findManyByEmail).not.toHaveBeenCalled()
    expect(deps.tokens.issue).not.toHaveBeenCalled()
  })
  it('reveals tenant choices only after proof, without consuming the code or issuing a token', async () => {
    const deps = createDeps()
    vi.mocked(deps.users.findManyByEmail).mockResolvedValue([user, second])
    await expect(deps.useCase.execute({ email: user.email, code: '123456' })).resolves.toEqual({
      outcome: 'SELECT_TENANT',
      tenants: [
        { id: 'tenant-1', name: 'Account one', slug: 'one' },
        { id: 'tenant-2', name: 'Account two', slug: 'two' },
      ],
    })
    expect(deps.codes.verify).toHaveBeenCalledTimes(1)
    expect(deps.codes.verify).toHaveBeenCalledWith({
      email: user.email,
      codeHash: hashPasswordResetCode('123456'),
      consume: false,
    })
    expect(deps.tokens.issue).not.toHaveBeenCalled()
  })
  it('consumes once and binds the token to the selected user and current session version', async () => {
    const deps = createDeps()
    vi.mocked(deps.users.findManyByEmail).mockResolvedValue([user, second])
    await expect(
      deps.useCase.execute({ email: user.email, code: '123456', tenantId: second.tenantId }),
    ).resolves.toEqual({ resetToken: 'reset-token' })
    expect(deps.codes.verify).toHaveBeenLastCalledWith({
      email: user.email,
      codeHash: hashPasswordResetCode('123456'),
      consume: true,
    })
    expect(deps.tokens.issue).toHaveBeenCalledWith(second.id, 5)
  })
  it('also consumes the code for a single account', async () => {
    const deps = createDeps()
    await deps.useCase.execute({ email: user.email, code: '123456' })
    expect(deps.tokens.issue).toHaveBeenCalledWith(user.id, 3)
    expect(deps.codes.verify).toHaveBeenCalledTimes(2)
  })
  it('rejects an unrelated tenant without consuming proof or issuing a token', async () => {
    const deps = createDeps()
    await expect(
      deps.useCase.execute({ email: user.email, code: '123456', tenantId: 'foreign' }),
    ).rejects.toThrow(InvalidPasswordResetCodeError)
    expect(deps.codes.verify).toHaveBeenCalledTimes(1)
    expect(deps.tokens.issue).not.toHaveBeenCalled()
  })
  it('does not issue a token when proof was consumed concurrently or expired during selection', async () => {
    const deps = createDeps()
    vi.mocked(deps.codes.verify).mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    await expect(deps.useCase.execute({ email: user.email, code: '123456' })).rejects.toThrow(
      InvalidPasswordResetCodeError,
    )
    expect(deps.tokens.issue).not.toHaveBeenCalled()
  })
})
