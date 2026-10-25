import { act, renderHook, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRegister } from '../../hooks/use-register'
import { registrationService } from '../../services/registration-service'
import type { RegistrationDetailsFormValues } from '../../types/registration'
import { AuthQueryTestProvider } from '../fixtures/auth-query-provider'

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))
vi.mock('@/i18n/navigation', () => ({ useRouter: () => router }))
vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))
vi.mock('../../services/registration-service', () => ({
  registrationService: { register: vi.fn() },
}))

const values: RegistrationDetailsFormValues = {
  profile: 'proprietario',
  fullName: 'Ana Proprietária',
  email: 'ana@ketris.dev',
  phone: '(11) 99999-9999',
  password: 'senha-longa-123',
  passwordConfirmation: 'senha-longa-123',
  creci: '',
  acceptTerms: true,
}
const verification = {
  outcome: 'PENDING_EMAIL_VERIFICATION' as const,
  email: values.email,
  tenantId: 't1',
  emailSent: true,
}
function renderRegister() {
  return renderHook(() => useRegister(), { wrapper: AuthQueryTestProvider })
}

describe('useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(registrationService.register).mockResolvedValue(verification)
    vi.mocked(signIn).mockResolvedValue({ error: null, ok: true, status: 200, url: null })
  })
  it('preserva telefone e aceite, omite confirmação de senha e aguarda prova do e-mail sem criar sessão', async () => {
    const { result } = renderRegister()
    await act(async () => {
      expect(await result.current.register(values)).toBe(true)
    })
    expect(registrationService.register).toHaveBeenCalledWith({
      profile: values.profile,
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      password: values.password,
      acceptTerms: true,
      locale: 'pt-BR',
    })
    await waitFor(() => expect(result.current.pendingEmailVerification).toEqual(verification))
    expect(signIn).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })
  it('preserva CRECI e imobiliária selecionada para o corretor', async () => {
    const { result } = renderRegister()
    await act(async () => {
      await result.current.register({
        ...values,
        profile: 'corretor',
        agencyId: 'agency-1',
        creci: '12345-F',
      })
    })
    expect(registrationService.register).toHaveBeenCalledWith(
      expect.objectContaining({ agencyId: 'agency-1', creci: '12345-F' }),
    )
  })
  it('mostra aprovação pendente somente após a confirmação real, sem conceder sessão', async () => {
    const { result } = renderRegister()
    await act(async () => {
      await result.current.register(values)
    })
    await act(async () => {
      await result.current.completeEmailVerification({
        outcome: 'PENDING_APPROVAL',
        email: values.email,
      })
    })
    await waitFor(() => expect(result.current.pendingApproval).toBe(true))
    expect(result.current.pendingEmailVerification).toBeNull()
    expect(signIn).not.toHaveBeenCalled()
  })
  it('preserva a conta criada se o provedor de e-mail falhar e permite reenviar na etapa de confirmação', async () => {
    vi.mocked(registrationService.register).mockResolvedValue({ ...verification, emailSent: false })
    const { result } = renderRegister()
    await act(async () => {
      expect(await result.current.register(values)).toBe(true)
    })
    await waitFor(() => expect(result.current.pendingEmailVerification?.emailSent).toBe(false))
    expect(signIn).not.toHaveBeenCalled()
  })
  it.each([
    ['AGENCY_NOT_FOUND', 'Imobiliária não encontrada. Tente buscar novamente.'],
    ['EMAIL_ALREADY_IN_USE', 'Já existe uma conta com este e-mail.'],
    ['UNKNOWN', 'Não foi possível concluir o cadastro. Tente novamente.'],
  ])('traduz erro %s pelo código', async (code, message) => {
    vi.mocked(registrationService.register).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { code } } },
    })
    const { result } = renderRegister()
    await act(async () => {
      expect(await result.current.register(values)).toBe(false)
    })
    await waitFor(() => expect(result.current.error).toBe(message))
    expect(signIn).not.toHaveBeenCalled()
  })
})
