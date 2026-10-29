import { describe, expect, it, vi } from 'vitest'
import { ConfirmPublicEmailChangeUseCase } from '../../../application/use-cases/confirm-public-email-change.use-case'
import {
  account,
  verificationCode,
  verificationDeps,
  verificationRecord,
} from './email-verification.fixtures'
const input = { requestId: 'proof-1', code: verificationCode }
function setup() {
  const d = verificationDeps()
  return { ...d, useCase: new ConfirmPublicEmailChangeUseCase(d.users, d.codes) }
}
describe('ConfirmPublicEmailChangeUseCase', () => {
  it('usa a identidade da prova, sem sessão nem userId/e-mail fornecidos pelo cliente', async () => {
    const d = setup()
    await d.useCase.execute(input)
    expect(d.users.findById).toHaveBeenCalledWith('u1')
    expect(d.codes.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        id: input.requestId,
        userId: 'u1',
        tenantId: 't1',
        currentEmail: 'ana@example.test',
        targetEmail: 'next@example.test',
      }),
    )
    expect(d.users.update).not.toHaveBeenCalled()
  })
  it.each([
    null,
    verificationRecord({ purpose: 'SIGNUP' }),
    verificationRecord({ consumedAt: new Date() }),
    verificationRecord({ expiresAt: new Date(0) }),
    verificationRecord({ attempts: 5 }),
  ])(
    'rejeita link inexistente, de outra finalidade, consumido, expirado ou esgotado',
    async (proof) => {
      const d = setup()
      vi.mocked(d.codes.findById).mockResolvedValue(proof)
      await expect(d.useCase.execute(input)).rejects.toMatchObject({
        code: 'INVALID_EMAIL_VERIFICATION_CODE',
      })
      expect(d.codes.confirm).not.toHaveBeenCalled()
    },
  )
  it('impede prova de um tenant de alterar conta de outro e não aceita consumo concorrente', async () => {
    const d = setup()
    vi.mocked(d.users.findById).mockResolvedValue(account({ tenantId: 'foreign' }))
    await expect(d.useCase.execute(input)).rejects.toMatchObject({
      code: 'INVALID_EMAIL_VERIFICATION_CODE',
    })
    expect(d.codes.confirm).not.toHaveBeenCalled()
    vi.mocked(d.users.findById).mockResolvedValue(account())
    vi.mocked(d.codes.confirm).mockResolvedValue(false)
    await expect(d.useCase.execute(input)).rejects.toMatchObject({
      code: 'INVALID_EMAIL_VERIFICATION_CODE',
    })
  })
})
