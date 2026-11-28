import { describe, expect, it, vi } from 'vitest'
import { ConfirmEmailChangeUseCase } from '../../../application/use-cases/confirm-email-change.use-case'
import { account, verificationCode, verificationDeps } from './email-verification.fixtures'
const input = {
  actorId: 'u1',
  actorTenantId: 't1',
  email: 'NEXT@example.test',
  code: verificationCode,
}
function setup() {
  const d = verificationDeps()
  return { ...d, useCase: new ConfirmEmailChangeUseCase(d.users, d.codes, d.attempts) }
}
describe('ConfirmEmailChangeUseCase', () => {
  it('solicita confirmação atômica da conta, tenant, e-mail atual e novo endereço', async () => {
    const d = setup()
    await d.useCase.execute(input)
    expect(d.codes.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        tenantId: 't1',
        currentEmail: 'ana@example.test',
        targetEmail: 'next@example.test',
        purpose: 'EMAIL_CHANGE',
      }),
    )
    expect(d.users.update).not.toHaveBeenCalled()
  })
  it.each([null, account({ tenantId: 'foreign' })])(
    'não confirma por conta inexistente ou tenant estrangeiro',
    async (user) => {
      const d = setup()
      vi.mocked(d.users.findById).mockResolvedValue(user)
      await expect(d.useCase.execute(input)).rejects.toMatchObject({ code: 'USER_NOT_FOUND' })
      expect(d.codes.confirm).not.toHaveBeenCalled()
    },
  )
  it('rejeita conta inativa e código destinado a outro endereço', async () => {
    const d = setup()
    vi.mocked(d.users.findById).mockResolvedValue(account({ active: false }))
    await expect(d.useCase.execute(input)).rejects.toMatchObject({ code: 'ACCOUNT_DEACTIVATED' })
    vi.mocked(d.users.findById).mockResolvedValue(account())
    await expect(
      d.useCase.execute({ ...input, email: 'wrong@example.test' }),
    ).rejects.toMatchObject({ code: 'INVALID_EMAIL_VERIFICATION_CODE' })
    expect(d.codes.confirm).not.toHaveBeenCalled()
  })
  it('rejeita código errado e consumo concorrente sem executar update independente', async () => {
    const d = setup()
    await expect(d.useCase.execute({ ...input, code: '999999' })).rejects.toMatchObject({
      code: 'INVALID_EMAIL_VERIFICATION_CODE',
    })
    expect(d.codes.incrementAttempts).toHaveBeenCalledWith('proof-1', 'u1', 't1')
    vi.mocked(d.codes.confirm).mockResolvedValue(false)
    await expect(d.useCase.execute(input)).rejects.toMatchObject({
      code: 'INVALID_EMAIL_VERIFICATION_CODE',
    })
    expect(d.users.update).not.toHaveBeenCalled()
  })
  it('bloqueia pelo e-mail de destino do código, não pelo e-mail informado, antes de comparar o código', async () => {
    const d = setup()
    vi.mocked(d.attempts.isBlocked).mockResolvedValue(true)
    await expect(
      d.useCase.execute({ ...input, email: 'varied@example.test' }),
    ).rejects.toMatchObject({ status: 429 })
    expect(d.attempts.isBlocked).toHaveBeenCalledWith('EMAIL_CHANGE', 'next@example.test')
    expect(d.codes.incrementAttempts).not.toHaveBeenCalled()
    expect(d.codes.confirm).not.toHaveBeenCalled()
  })

  it('registra falha por código errado e não registra quando a confirmação funciona', async () => {
    const d = setup()
    await d.useCase.execute(input)
    expect(d.attempts.recordFailure).not.toHaveBeenCalled()
    await expect(d.useCase.execute({ ...input, code: '999999' })).rejects.toMatchObject({
      code: 'INVALID_EMAIL_VERIFICATION_CODE',
    })
    expect(d.attempts.recordFailure).toHaveBeenCalledWith('EMAIL_CHANGE', 'next@example.test')
  })
})
