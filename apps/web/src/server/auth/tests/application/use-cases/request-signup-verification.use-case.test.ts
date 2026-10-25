import { describe, expect, it, vi } from 'vitest'
import { RequestSignupVerificationUseCase } from '../../../application/use-cases/request-signup-verification.use-case'
import { account, verificationDeps } from './email-verification.fixtures'

vi.mock('../../../application/password-reset-email', () => ({
  buildEmailVerificationEmail: vi.fn().mockResolvedValue({
    subject: 'Confirmação',
    text: 'Código de teste',
    html: '<p>Código de teste</p>',
  }),
}))
const input = { email: 'ana@example.test', tenantId: 't1', locale: 'pt-BR' as const }
function setup() {
  const deps = verificationDeps()
  vi.mocked(deps.users.findByEmail).mockResolvedValue(account({ emailVerifiedAt: null }))
  return {
    ...deps,
    useCase: new RequestSignupVerificationUseCase(deps.users, deps.codes, deps.mailer),
  }
}

describe('RequestSignupVerificationUseCase', () => {
  it('procura somente a conta do tenant e persiste prova antes de enviar e-mail', async () => {
    const d = setup()
    await d.useCase.execute(input)
    expect(d.users.findByEmail).toHaveBeenCalledWith(input.email, 't1')
    const stored = vi.mocked(d.codes.replace).mock.calls[0][0]
    expect(stored).toMatchObject({ userId: 'u1', tenantId: 't1', purpose: 'SIGNUP' })
    expect(stored.codeHash).toMatch(/^[a-f0-9]{64}$/)
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now())
    expect(d.mailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: input.email }))
  })
  it.each([
    null,
    account(),
    account({ emailVerifiedAt: null, ativo: false }),
    account({ emailVerifiedAt: null, tenantStatus: 'SUSPENDED' }),
    account({ emailVerifiedAt: null, tenantStatus: 'CANCELED' }),
  ])('não revela nem envia para conta inelegível', async (user) => {
    const d = setup()
    vi.mocked(d.users.findByEmail).mockResolvedValue(user)
    await expect(d.useCase.execute(input)).resolves.toBeUndefined()
    expect(d.codes.replace).not.toHaveBeenCalled()
    expect(d.mailer.send).not.toHaveBeenCalled()
  })
  it('respeita o intervalo de reenvio e não envia quando a prova não foi criada', async () => {
    const d = setup()
    vi.mocked(d.codes.replace).mockResolvedValue(null)
    await expect(d.useCase.execute(input)).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' })
    expect(d.mailer.send).not.toHaveBeenCalled()
  })
  it('distingue indisponibilidade da entrega sem encobrir falha do banco', async () => {
    const d = setup()
    vi.mocked(d.mailer.send).mockRejectedValue(new Error('transporte indisponível'))
    await expect(d.useCase.execute(input)).rejects.toMatchObject({ code: 'EMAIL_DELIVERY_FAILED' })
    const failure = new Error('banco indisponível')
    vi.mocked(d.codes.replace).mockRejectedValue(failure)
    await expect(d.useCase.execute(input)).rejects.toBe(failure)
  })
})
