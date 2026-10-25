import { describe, expect, it, vi } from 'vitest'
import { RequestEmailChangeUseCase } from '../../../application/use-cases/request-email-change.use-case'
import { account, verificationDeps } from './email-verification.fixtures'
vi.mock('../../../application/password-reset-email', () => ({
  buildEmailVerificationEmail: vi.fn().mockResolvedValue({
    subject: 'Confirmação',
    text: 'Código de teste',
    html: '<p>Código de teste</p>',
  }),
}))
const input = {
  actorId: 'u1',
  actorTenantId: 't1',
  actorPapel: 'OWNER' as const,
  email: 'NEXT@example.test',
  locale: 'pt-BR' as const,
}
function setup() {
  const d = verificationDeps()
  return { ...d, useCase: new RequestEmailChangeUseCase(d.users, d.codes, d.mailer) }
}
describe('RequestEmailChangeUseCase', () => {
  it('mantém o e-mail atual e envia prova somente ao novo endereço normalizado', async () => {
    const d = setup()
    await d.useCase.execute(input)
    expect(d.codes.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        tenantId: 't1',
        targetEmail: 'next@example.test',
        purpose: 'EMAIL_CHANGE',
      }),
    )
    expect(d.users.update).not.toHaveBeenCalled()
    expect(d.mailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'next@example.test' }))
  })
  it('permite à gestão iniciar correção de conta ainda não verificada sem alterar sua identidade', async () => {
    const d = setup()
    vi.mocked(d.users.findById).mockResolvedValue(account({ id: 'target', emailVerifiedAt: null }))
    await d.useCase.execute({ ...input, targetUserId: 'target' })
    expect(d.codes.replace).toHaveBeenCalledWith(expect.objectContaining({ userId: 'target' }))
    expect(d.users.update).not.toHaveBeenCalled()
  })
  it('impede corretor de iniciar alteração de outra pessoa e não vaza conta de outro tenant', async () => {
    const d = setup()
    await expect(
      d.useCase.execute({ ...input, actorPapel: 'AGENT', targetUserId: 'target' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(d.users.findById).not.toHaveBeenCalled()
    vi.mocked(d.users.findById).mockResolvedValue(account({ tenantId: 'foreign' }))
    await expect(d.useCase.execute(input)).rejects.toMatchObject({ code: 'USER_NOT_FOUND' })
    expect(d.codes.replace).not.toHaveBeenCalled()
  })
  it('não envia quando o endereço não mudou, já está em uso no tenant ou o reenvio está limitado', async () => {
    const d = setup()
    await d.useCase.execute({ ...input, email: 'ana@example.test' })
    expect(d.mailer.send).not.toHaveBeenCalled()
    vi.mocked(d.users.findByEmail).mockResolvedValue(account({ id: 'other' }))
    await expect(d.useCase.execute(input)).rejects.toMatchObject({ code: 'EMAIL_ALREADY_IN_USE' })
    vi.mocked(d.users.findByEmail).mockResolvedValue(null)
    vi.mocked(d.codes.replace).mockResolvedValue(null)
    await expect(d.useCase.execute(input)).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' })
    expect(d.mailer.send).not.toHaveBeenCalled()
  })
})
