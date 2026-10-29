import { describe, expect, it, vi } from 'vitest'
import { ConfirmSignupVerificationUseCase } from '../../../application/use-cases/confirm-signup-verification.use-case'
import {
  account,
  verificationCode,
  verificationDeps,
  verificationRecord,
} from './email-verification.fixtures'
const input = { email: 'ana@example.test', tenantId: 't1', code: verificationCode }
function setup() {
  const d = verificationDeps()
  vi.mocked(d.users.findByEmail).mockResolvedValue(account({ emailVerifiedAt: null }))
  vi.mocked(d.codes.findLatest).mockResolvedValue(
    verificationRecord({ purpose: 'SIGNUP', targetEmail: input.email }),
  )
  return {
    ...d,
    useCase: new ConfirmSignupVerificationUseCase(d.users, d.codes, d.tokens, d.refresh),
  }
}
describe('ConfirmSignupVerificationUseCase', () => {
  it('emite sessão somente depois de confirmar a prova e reler a conta verificada', async () => {
    const d = setup()
    const result = await d.useCase.execute(input)
    expect(result.outcome).toBe('REGISTERED')
    expect(d.codes.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 't1', userId: 'u1', purpose: 'SIGNUP' }),
    )
    expect(d.tokens.sign).toHaveBeenCalled()
    expect(d.refresh.create).toHaveBeenCalledTimes(1)
  })
  it('não concede acesso a corretor sem aprovação mesmo após comprovar o e-mail', async () => {
    const d = setup()
    vi.mocked(d.users.findById).mockResolvedValue(
      account({ role: 'AGENT', membershipApprovedAt: null }),
    )
    await expect(d.useCase.execute(input)).resolves.toEqual({
      outcome: 'PENDING_APPROVAL',
      email: input.email,
    })
    expect(d.tokens.sign).not.toHaveBeenCalled()
    expect(d.refresh.create).not.toHaveBeenCalled()
  })
  it.each([
    null,
    verificationRecord({ purpose: 'SIGNUP', targetEmail: input.email, consumedAt: new Date() }),
    verificationRecord({ purpose: 'SIGNUP', targetEmail: input.email, attempts: 5 }),
    verificationRecord({ purpose: 'SIGNUP', targetEmail: input.email, expiresAt: new Date(0) }),
  ])('rejeita prova ausente, consumida, esgotada ou expirada sem emitir tokens', async (proof) => {
    const d = setup()
    vi.mocked(d.codes.findLatest).mockResolvedValue(proof)
    await expect(d.useCase.execute(input)).rejects.toMatchObject({
      code: 'INVALID_EMAIL_VERIFICATION_CODE',
    })
    expect(d.codes.confirm).not.toHaveBeenCalled()
    expect(d.tokens.sign).not.toHaveBeenCalled()
  })
  it('contabiliza tentativa incorreta e não confirma outra conta', async () => {
    const d = setup()
    await expect(d.useCase.execute({ ...input, code: '999999' })).rejects.toMatchObject({
      code: 'INVALID_EMAIL_VERIFICATION_CODE',
    })
    expect(d.codes.incrementAttempts).toHaveBeenCalledWith('proof-1', 'u1', 't1')
    expect(d.codes.confirm).not.toHaveBeenCalled()
  })
  it('não emite sessão se outra requisição já consumiu a prova ou a conta foi bloqueada', async () => {
    const d = setup()
    vi.mocked(d.codes.confirm).mockResolvedValue(false)
    await expect(d.useCase.execute(input)).rejects.toMatchObject({
      code: 'INVALID_EMAIL_VERIFICATION_CODE',
    })
    expect(d.tokens.sign).not.toHaveBeenCalled()
    vi.mocked(d.codes.confirm).mockResolvedValue(true)
    vi.mocked(d.users.findById).mockResolvedValue(account({ active: false }))
    await expect(d.useCase.execute(input)).rejects.toMatchObject({ code: 'ACCOUNT_DEACTIVATED' })
    expect(d.refresh.create).not.toHaveBeenCalled()
  })
})
