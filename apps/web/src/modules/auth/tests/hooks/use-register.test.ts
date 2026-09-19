import { act, renderHook } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRegister } from '../../hooks/use-register'
import type { RegistrationDetailsFormValues } from '../../schemas/registration-details-schema'

const routerMock = {
  replace: vi.fn(),
  refresh: vi.fn(),
}

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}))

const proprietarioValues: RegistrationDetailsFormValues = {
  profile: 'proprietario',
  fullName: 'Ana Proprietária',
  email: 'ana@ketris.dev',
  phone: '(11) 99999-9999',
  password: 'senha-longa-123',
  passwordConfirmation: 'senha-longa-123',
  creci: '',
  acceptTerms: true,
}

function mockRegisterResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

async function register(
  result: { current: ReturnType<typeof useRegister> },
  values: RegistrationDetailsFormValues,
): Promise<boolean> {
  let success = false
  await act(async () => {
    success = await result.current.register(values)
  })
  return success
}

describe('useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cria a conta, estabelece a sessão via token-session e redireciona pro dashboard (ADMIN)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockRegisterResponse(201, {
          outcome: 'REGISTERED',
          user: { role: 'ADMIN' },
          accessToken: 'access-fake',
          refreshToken: 'refresh-fake',
        }),
      ),
    )
    vi.mocked(signIn).mockResolvedValue({ error: null, ok: true, status: 200, url: null })

    const { result } = renderHook(() => useRegister())
    const success = await register(result, proprietarioValues)

    expect(fetch).toHaveBeenCalledWith('/api/register', expect.objectContaining({ method: 'POST' }))
    expect(signIn).toHaveBeenCalledWith(
      'token-session',
      expect.objectContaining({ accessToken: 'access-fake', refreshToken: 'refresh-fake' }),
    )
    expect(routerMock.replace).toHaveBeenCalledWith('/pt/dashboard')
    expect(routerMock.refresh).toHaveBeenCalled()
    expect(success).toBe(true)
    expect(result.current.pendingApproval).toBe(false)
  })

  it('redireciona pra home pública quando o papel é RENTER', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockRegisterResponse(201, {
          outcome: 'REGISTERED',
          user: { role: 'RENTER' },
          accessToken: 'access-fake',
          refreshToken: 'refresh-fake',
        }),
      ),
    )
    vi.mocked(signIn).mockResolvedValue({ error: null, ok: true, status: 200, url: null })

    const { result } = renderHook(() => useRegister())
    await register(result, { ...proprietarioValues, profile: 'locatario' })

    expect(routerMock.replace).toHaveBeenCalledWith('/pt')
  })

  it('marca pendingApproval e não chama signIn quando o corretor fica pendente', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          mockRegisterResponse(202, { outcome: 'PENDING_APPROVAL', email: 'corretor@ketris.dev' }),
        ),
    )

    const { result } = renderHook(() => useRegister())
    const success = await register(result, { ...proprietarioValues, profile: 'corretor' })

    expect(signIn).not.toHaveBeenCalled()
    expect(success).toBe(true)
    expect(result.current.pendingApproval).toBe(true)
  })

  it('mostra a mensagem específica quando a imobiliária não é encontrada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockRegisterResponse(404, { error: { code: 'AGENCY_NOT_FOUND' } })),
    )

    const { result } = renderHook(() => useRegister())
    await register(result, proprietarioValues)

    expect(result.current.error).toBe('Imobiliária não encontrada. Tente buscar novamente.')
  })

  it('mostra a mensagem específica quando o e-mail já está em uso', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(mockRegisterResponse(409, { error: { code: 'EMAIL_ALREADY_IN_USE' } })),
    )

    const { result } = renderHook(() => useRegister())
    await register(result, proprietarioValues)

    expect(result.current.error).toBe('Já existe uma conta com este e-mail.')
  })

  it('mostra a mensagem genérica para códigos de erro desconhecidos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockRegisterResponse(500, { error: { code: 'INTERNAL_ERROR' } })),
    )

    const { result } = renderHook(() => useRegister())
    await register(result, proprietarioValues)

    expect(result.current.error).toBe('Não foi possível concluir o cadastro. Tente novamente.')
  })

  it('mostra a mensagem genérica quando a requisição falha por rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const { result } = renderHook(() => useRegister())
    const success = await register(result, proprietarioValues)

    expect(success).toBe(false)
    expect(result.current.error).toBe('Não foi possível concluir o cadastro. Tente novamente.')
  })

  it('mostra a mensagem genérica quando o REST cria a conta mas a sessão não é estabelecida', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockRegisterResponse(201, {
          outcome: 'REGISTERED',
          user: { role: 'ADMIN' },
          accessToken: 'access-fake',
          refreshToken: 'refresh-fake',
        }),
      ),
    )
    vi.mocked(signIn).mockResolvedValue({
      error: 'CredentialsSignin',
      ok: false,
      status: 401,
      url: null,
    })

    const { result } = renderHook(() => useRegister())
    const success = await register(result, proprietarioValues)

    expect(success).toBe(false)
    expect(routerMock.replace).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Não foi possível concluir o cadastro. Tente novamente.')
  })
})
