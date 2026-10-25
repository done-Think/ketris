import { describe, expect, it, vi } from 'vitest'

import type { Mailer } from '@server/shared/email/mailer.port'
import type { EmailOwnershipCodeRepository } from '../../../application/ports/email-ownership-code-repository.port'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { RequestPasswordResetCodeUseCase } from '../../../application/use-cases/request-password-reset-code.use-case'
import { hashPasswordResetCode } from '../../../domain/password-reset-code'
import type { User } from '../../../domain/user.entity'

const user: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  nome: 'Ana',
  email: 'ana@example.com',
  senhaHash: 'hash',
  papel: 'AGENT',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}
function createDeps() {
  const users = {
    findManyByEmail: vi.fn().mockResolvedValue([user]),
    findByEmail: vi.fn(),
  } as unknown as UserRepository
  const codes: EmailOwnershipCodeRepository = {
    replace: vi.fn().mockResolvedValue(true),
    verify: vi.fn(),
  }
  const mailer: Mailer = { send: vi.fn().mockResolvedValue(undefined) }
  return {
    users,
    codes,
    mailer,
    useCase: new RequestPasswordResetCodeUseCase(users, codes, mailer),
  }
}

describe('RequestPasswordResetCodeUseCase', () => {
  it('sends one mailbox code for all accounts without choosing or exposing a tenant', async () => {
    const deps = createDeps()
    vi.mocked(deps.users.findManyByEmail).mockResolvedValue([
      user,
      { ...user, id: 'user-2', tenantId: 'tenant-2' },
    ])
    await expect(
      deps.useCase.execute({ email: ' ANA@EXAMPLE.COM ', locale: 'pt-BR' }),
    ).resolves.toBeUndefined()
    expect(deps.users.findManyByEmail).toHaveBeenCalledWith('ana@example.com')
    expect(deps.users.findByEmail).not.toHaveBeenCalled()
    expect(deps.mailer.send).toHaveBeenCalledTimes(1)
    const stored = vi.mocked(deps.codes.replace).mock.calls[0][0]
    expect(stored).toMatchObject({
      email: 'ana@example.com',
      codeHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      expiresAt: expect.any(Date),
    })
    expect(stored).not.toHaveProperty('tenantId')
    expect(stored.expiresAt.getTime() - Date.now()).toBeGreaterThan(590_000)
    const email = vi.mocked(deps.mailer.send).mock.calls[0][0]
    const sentCode = `${email.text} ${email.html}`.match(/\b\d{6}\b/)?.[0]
    expect(sentCode).toBeDefined()
    expect(stored.codeHash).toBe(hashPasswordResetCode(sentCode!))
  })
  it('keeps the same empty result for unknown email and mailbox cooldown', async () => {
    const deps = createDeps()
    vi.mocked(deps.users.findManyByEmail).mockResolvedValueOnce([])
    await expect(
      deps.useCase.execute({ email: 'unknown@example.com', locale: 'en-US' }),
    ).resolves.toBeUndefined()
    expect(deps.codes.replace).not.toHaveBeenCalled()
    vi.mocked(deps.codes.replace).mockResolvedValue(false)
    await expect(
      deps.useCase.execute({ email: user.email, locale: 'en-US' }),
    ).resolves.toBeUndefined()
    expect(deps.mailer.send).not.toHaveBeenCalled()
  })
  it('does not reveal account existence through an email delivery failure', async () => {
    const deps = createDeps()
    vi.mocked(deps.mailer.send).mockRejectedValue(new Error('delivery failed'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await expect(
        deps.useCase.execute({ email: user.email, locale: 'es-ES' }),
      ).resolves.toBeUndefined()
      expect(log).toHaveBeenCalledWith('[auth] Password recovery email delivery failed.')
    } finally {
      log.mockRestore()
    }
  })
})
