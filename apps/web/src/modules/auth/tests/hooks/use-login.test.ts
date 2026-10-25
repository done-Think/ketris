import { act, renderHook, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import messages from '@/i18n/messages/pt-BR/auth.json'
import { useLogin } from '../../hooks/use-login'
import { authService } from '../../services/auth-service'
import type { AuthLoginResponse } from '../../types/auth-api'
import { AuthQueryTestProvider } from '../fixtures/auth-query-provider'

const routerMock = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))
vi.mock('@/i18n/navigation', () => ({ useRouter: () => routerMock }))
vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))
vi.mock('../../services/auth-service', () => ({ authService: { login: vi.fn() } }))

const credentials = { email: 'ana@ketris.dev', password: 'segredo123' }
const authenticated = {
  user: {
    id: 'u1',
    tenantId: 't1',
    name: 'Ana',
    email: credentials.email,
    role: 'AGENT',
    active: true,
    avatarUrl: null,
    pendingApproval: false,
    phone: null,
    creci: null,
  },
  accessToken: 'access-fake',
  refreshToken: 'refresh-fake',
} satisfies AuthLoginResponse

function renderLogin(callbackUrl = '/dashboard') {
  return renderHook(() => useLogin(callbackUrl), { wrapper: AuthQueryTestProvider })
}

function apiError(code: string) {
  return Object.assign(new Error('request failed'), {
    isAxiosError: true,
    response: { data: { error: { code, message: 'Server text must not reach the interface' } } },
  })
}

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.login).mockResolvedValue(authenticated)
    vi.mocked(signIn).mockResolvedValue({ error: null, ok: true, status: 200, url: null })
  })

  it('establishes the session after authentication and navigates through the localized router', async () => {
    const { result } = renderLogin()
    await act(async () => {
      expect(await result.current.login(credentials)).toBe(true)
    })
    expect(authService.login).toHaveBeenCalledWith({ ...credentials, locale: 'pt-BR' })
    expect(signIn).toHaveBeenCalledWith(
      'token-session',
      expect.objectContaining({
        accessToken: 'access-fake',
        refreshToken: 'refresh-fake',
        redirect: false,
      }),
    )
    expect(routerMock.replace).toHaveBeenCalledWith('/dashboard')
    expect(routerMock.refresh).toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('routes renters to their permitted home', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      ...authenticated,
      user: { ...authenticated.user, role: 'RENTER' },
    })
    const { result } = renderLogin('/dashboard/team')
    await act(async () => {
      await result.current.login(credentials)
    })
    expect(routerMock.replace).toHaveBeenCalledWith('/dashboard/finance/charges')
  })

  it('shows tenant choices without establishing a session, then authenticates the selected account', async () => {
    const tenants = [
      { id: 't1', name: 'Horizonte', slug: 'horizonte' },
      { id: 't2', name: 'Outra', slug: 'outra' },
    ]
    vi.mocked(authService.login).mockResolvedValueOnce({ outcome: 'SELECT_TENANT', tenants })
    const { result } = renderLogin()
    await act(async () => {
      expect(await result.current.login(credentials)).toBe(false)
    })
    await waitFor(() => expect(result.current.tenants).toEqual(tenants))
    expect(signIn).not.toHaveBeenCalled()
    expect(routerMock.replace).not.toHaveBeenCalled()
    await act(async () => {
      expect(await result.current.login({ ...credentials, tenantId: 't2' })).toBe(true)
    })
    expect(authService.login).toHaveBeenLastCalledWith({
      ...credentials,
      tenantId: 't2',
      locale: 'pt-BR',
    })
  })

  it('solicita confirmação real para conta não verificada, sem criar sessão nem oferecer tenants indevidos', async () => {
    const verification = {
      outcome: 'PENDING_EMAIL_VERIFICATION' as const,
      email: credentials.email,
      tenantId: 't1',
      emailSent: true,
    }
    vi.mocked(authService.login).mockResolvedValue(verification)
    const { result } = renderLogin()
    await act(async () => {
      expect(await result.current.login(credentials)).toBe(false)
    })
    await waitFor(() => expect(result.current.pendingEmailVerification).toEqual(verification))
    expect(result.current.tenants).toEqual([])
    expect(signIn).not.toHaveBeenCalled()
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it.each([
    ['INVALID_CREDENTIALS', messages.login.genericError],
    ['ACCOUNT_DEACTIVATED', messages.login.accountDeactivated],
    ['RATE_LIMIT_EXCEEDED', messages.login.rateLimited],
    ['TENANT_ACCESS_BLOCKED', messages.login.tenantBlocked],
    ['MEMBERSHIP_PENDING_APPROVAL', messages.login.membershipPending],
    ['EMAIL_NOT_VERIFIED', messages.login.emailNotVerified],
    ['UNKNOWN_ERROR', messages.login.genericError],
  ])('translates API error %s by code and does not establish a session', async (code, message) => {
    vi.mocked(authService.login).mockRejectedValue(apiError(code))
    const { result } = renderLogin()
    await act(async () => {
      expect(await result.current.login(credentials)).toBe(false)
    })
    await waitFor(() => expect(result.current.error).toBe(message))
    expect(signIn).not.toHaveBeenCalled()
  })

  it('reports network failures without navigating', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('network failed'))
    const { result } = renderLogin()
    await act(async () => {
      expect(await result.current.login(credentials)).toBe(false)
    })
    await waitFor(() => expect(result.current.error).toBe(messages.login.genericError))
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('reports failure to create the NextAuth session after a successful API response', async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: 'CredentialsSignin',
      ok: false,
      status: 401,
      url: null,
    })
    const { result } = renderLogin()
    await act(async () => {
      expect(await result.current.login(credentials)).toBe(false)
    })
    await waitFor(() => expect(result.current.error).toBe(messages.login.genericError))
    expect(routerMock.replace).not.toHaveBeenCalled()
  })
})
