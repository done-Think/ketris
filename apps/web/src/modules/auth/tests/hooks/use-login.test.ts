import { act, renderHook } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLogin } from '../../hooks/use-login'
import type { LoginFormValues } from '../../schemas/login-schema'

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

function mockLoginResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

async function login(
  result: { current: ReturnType<typeof useLogin> },
  values: LoginFormValues,
): Promise<boolean> {
  let success = false
  await act(async () => {
    success = await result.current.login(values)
  })
  return success
}

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('estabelece a sessão via token-session e redireciona quando o login é bem-sucedido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockLoginResponse(200, {
          user: { id: 'u1', name: 'Ana', email: 'ana@ketris.dev', role: 'AGENT', active: true },
          accessToken: 'access-fake',
          refreshToken: 'refresh-fake',
        }),
      ),
    )
    vi.mocked(signIn).mockResolvedValue({ error: null, ok: true, status: 200, url: null })

    const { result } = renderHook(() => useLogin('/dashboard'))
    const success = await login(result, { email: 'ana@ketris.dev', password: 'segredo123' })

    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'ana@ketris.dev', password: 'segredo123' }),
      }),
    )
    expect(signIn).toHaveBeenCalledWith(
      'token-session',
      expect.objectContaining({ accessToken: 'access-fake', refreshToken: 'refresh-fake' }),
    )
    expect(routerMock.replace).toHaveBeenCalled()
    expect(routerMock.refresh).toHaveBeenCalled()
    expect(success).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('mostra a mensagem genérica quando as credenciais são inválidas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockLoginResponse(401, { error: { code: 'INVALID_CREDENTIALS' } })),
    )

    const { result } = renderHook(() => useLogin('/dashboard'))
    const success = await login(result, { email: 'ana@ketris.dev', password: 'errada' })

    expect(success).toBe(false)
    expect(signIn).not.toHaveBeenCalled()
    expect(result.current.error).toBe(
      'Não foi possível entrar. Verifique seus dados e tente novamente.',
    )
  })

  it('mostra a mensagem específica quando a conta está desativada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockLoginResponse(403, { error: { code: 'ACCOUNT_DEACTIVATED' } })),
    )

    const { result } = renderHook(() => useLogin('/dashboard'))
    await login(result, { email: 'ana@ketris.dev', password: 'segredo123' })

    expect(result.current.error).toBe(
      'Esta conta foi desativada. Entre em contato com o administrador.',
    )
  })

  it('mostra a mensagem específica quando o limite de tentativas é excedido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockLoginResponse(429, { error: { code: 'RATE_LIMIT_EXCEEDED' } })),
    )

    const { result } = renderHook(() => useLogin('/dashboard'))
    await login(result, { email: 'ana@ketris.dev', password: 'segredo123' })

    expect(result.current.error).toBe(
      'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    )
  })

  it('cai na mensagem genérica para códigos de erro desconhecidos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockLoginResponse(500, { error: { code: 'INTERNAL_ERROR' } })),
    )

    const { result } = renderHook(() => useLogin('/dashboard'))
    await login(result, { email: 'ana@ketris.dev', password: 'segredo123' })

    expect(result.current.error).toBe(
      'Não foi possível entrar. Verifique seus dados e tente novamente.',
    )
  })

  it('mostra a mensagem genérica quando a requisição falha por rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const { result } = renderHook(() => useLogin('/dashboard'))
    const success = await login(result, { email: 'ana@ketris.dev', password: 'x' })

    expect(success).toBe(false)
    expect(result.current.error).toBe(
      'Não foi possível entrar. Verifique seus dados e tente novamente.',
    )
  })

  it('mostra a mensagem genérica quando o REST responde ok mas a sessão não é estabelecida', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          mockLoginResponse(200, { accessToken: 'access-fake', refreshToken: 'refresh-fake' }),
        ),
    )
    vi.mocked(signIn).mockResolvedValue({
      error: 'CredentialsSignin',
      ok: false,
      status: 401,
      url: null,
    })

    const { result } = renderHook(() => useLogin('/dashboard'))
    const success = await login(result, { email: 'ana@ketris.dev', password: 'segredo123' })

    expect(success).toBe(false)
    expect(routerMock.replace).not.toHaveBeenCalled()
    expect(result.current.error).toBe(
      'Não foi possível entrar. Verifique seus dados e tente novamente.',
    )
  })
})
