import { renderHook } from '@testing-library/react'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRouter } from '@/i18n/navigation'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'

import { httpClient } from '../../../lib/api/http-client'
import { useHttpClientSessionSync } from '../../../lib/api/use-http-client-session-sync'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/i18n/navigation', async () => ({
  ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
  useRouter: vi.fn(),
}))

vi.mock('@shared/lib/auth/clear-client-session', () => ({
  clearClientSession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../lib/api/http-client', () => ({
  httpClient: {
    setAuthToken: vi.fn(),
    setAuthUnavailable: vi.fn(),
    setTenant: vi.fn(),
    setUnauthorizedHandler: vi.fn(),
    post: vi.fn(),
  },
}))

const router = { replace: vi.fn(), refresh: vi.fn() }

function mockSession(
  overrides: Partial<{
    accessToken: string
    refreshToken: string
    tenantId: string
    scope: 'tenant' | 'platform'
    authUnavailable: boolean
  }>,
  update = vi.fn(),
) {
  vi.mocked(useSession).mockReturnValue({
    data: { ...overrides },
    status: 'authenticated',
    update,
  } as unknown as ReturnType<typeof useSession>)

  return update
}

function getRegisteredHandler() {
  const call = vi.mocked(httpClient.setUnauthorizedHandler).mock.calls.at(-1)
  return call?.[0] as (() => Promise<string | null>) | null
}

describe('useHttpClientSessionSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>)
    vi.mocked(httpClient.post).mockReset()
  })

  it('prepares authentication before notification effects can start requests', () => {
    mockSession({ accessToken: 'login-token', tenantId: 'tenant-a' })
    const startRequest = vi.fn()
    renderHook(() => {
      useEffect(() => {
        startRequest(vi.mocked(httpClient.setAuthToken).mock.lastCall?.[0])
      }, [])
      useHttpClientSessionSync()
    })
    expect(startRequest).toHaveBeenCalledWith('login-token')
  })

  it.each([true, false])(
    'ignores a refresh completed after switching accounts (success: %s)',
    async (success) => {
      const update = vi.fn()
      let finish: () => void = () => undefined
      vi.mocked(httpClient.post).mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            finish = () =>
              success
                ? resolve({ accessToken: 'old-account-renewed', refreshToken: 'rotated' })
                : reject({ isAxiosError: true, response: { status: 401 } })
          }),
      )
      mockSession({ accessToken: 'old', refreshToken: 'old-refresh', tenantId: 'tenant-a' }, update)
      const view = renderHook(() => useHttpClientSessionSync())
      const refresh = getRegisteredHandler()?.()
      mockSession({ accessToken: 'new-account', refreshToken: 'new-refresh', tenantId: 'tenant-b' })
      view.rerender()
      finish()
      expect(await refresh).toBeNull()
      expect(update).not.toHaveBeenCalled()
      expect(clearClientSession).not.toHaveBeenCalled()
      expect(httpClient.setAuthToken).toHaveBeenLastCalledWith('new-account')
    },
  )

  it('sincroniza accessToken e tenantId da sessão pro httpClient', () => {
    mockSession({ accessToken: 'token-1', tenantId: 'tenant-1' })

    renderHook(() => useHttpClientSessionSync())

    expect(httpClient.setAuthToken).toHaveBeenCalledWith('token-1')
    expect(httpClient.setTenant).toHaveBeenCalledWith('tenant-1')
  })

  it.each([true, false])(
    'ignores refresh completion after unmount and remount with another account (success: %s)',
    async (success) => {
      const update = vi.fn().mockResolvedValue({ accessToken: 'renewed-a' })
      let finish: () => void = () => undefined
      vi.mocked(httpClient.post).mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            finish = () =>
              success
                ? resolve({ accessToken: 'renewed-a', refreshToken: 'rotated-a' })
                : reject({ isAxiosError: true, response: { status: 401 } })
          }),
      )
      mockSession(
        { accessToken: 'token-a', refreshToken: 'refresh-a', tenantId: 'tenant-a' },
        update,
      )
      const previous = renderHook(() => useHttpClientSessionSync())
      const refresh = getRegisteredHandler()?.()
      previous.unmount()
      mockSession({ accessToken: 'token-b', refreshToken: 'refresh-b', tenantId: 'tenant-b' })
      renderHook(() => useHttpClientSessionSync())
      const currentHandler = getRegisteredHandler()

      finish()

      expect(await refresh).toBeNull()
      expect(update).not.toHaveBeenCalled()
      expect(clearClientSession).not.toHaveBeenCalled()
      expect(router.replace).not.toHaveBeenCalled()
      expect(httpClient.setAuthToken).toHaveBeenLastCalledWith('token-b')
      expect(httpClient.setTenant).toHaveBeenLastCalledWith('tenant-b')
      expect(getRegisteredHandler()).toBe(currentHandler)
    },
  )

  it.each([true, false])(
    'ignores session validation after unmount and remount (unavailable: %s)',
    async (unavailable) => {
      let finishUpdate: () => void = () => undefined
      const update = vi.fn(
        () =>
          new Promise((resolve) => {
            finishUpdate = () =>
              resolve(unavailable ? { authUnavailable: true } : { accessToken: 'renewed-a' })
          }),
      )
      vi.mocked(httpClient.post).mockResolvedValue({
        accessToken: 'renewed-a',
        refreshToken: 'rotated-a',
      })
      mockSession(
        { accessToken: 'token-a', refreshToken: 'refresh-a', tenantId: 'tenant-a' },
        update,
      )
      const previous = renderHook(() => useHttpClientSessionSync())
      const refresh = getRegisteredHandler()?.()
      await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1))
      previous.unmount()
      mockSession({ accessToken: 'token-b', refreshToken: 'refresh-b', tenantId: 'tenant-b' })
      renderHook(() => useHttpClientSessionSync())

      finishUpdate()

      expect(await refresh).toBeNull()
      expect(httpClient.setAuthToken).toHaveBeenLastCalledWith('token-b')
      expect(httpClient.setAuthUnavailable).toHaveBeenLastCalledWith(false)
      expect(clearClientSession).not.toHaveBeenCalled()
      expect(router.replace).not.toHaveBeenCalled()
    },
  )

  it('does not start refresh through a handler retained after unmount', async () => {
    mockSession({ accessToken: 'token-a', refreshToken: 'refresh-a' })
    const previous = renderHook(() => useHttpClientSessionSync())
    const handler = getRegisteredHandler()
    previous.unmount()

    expect(await handler?.()).toBeNull()
    expect(httpClient.post).not.toHaveBeenCalled()
  })

  it('sem refreshToken, o handler de 401 limpa a sessão e redireciona pro login', async () => {
    mockSession({ accessToken: 'token-1' })
    renderHook(() => useHttpClientSessionSync())

    const handler = getRegisteredHandler()
    const result = await handler?.()

    expect(result).toBeNull()
    expect(clearClientSession).toHaveBeenCalledTimes(1)
    expect(router.replace).toHaveBeenCalledWith('/login')
    expect(router.refresh).toHaveBeenCalledTimes(1)
  })

  it('com refreshToken e refresh bem-sucedido, atualiza a sessão e o httpClient', async () => {
    const update = vi
      .fn()
      .mockResolvedValue({ accessToken: 'novo-access', refreshToken: 'novo-refresh' })
    mockSession({ accessToken: 'stale', refreshToken: 'refresh-1' }, update)
    vi.mocked(httpClient.post).mockResolvedValueOnce({
      accessToken: 'novo-access',
      refreshToken: 'novo-refresh',
    })

    renderHook(() => useHttpClientSessionSync())

    const handler = getRegisteredHandler()
    const result = await handler?.()

    expect(httpClient.post).toHaveBeenCalledWith(
      '/auth/refresh',
      { refreshToken: 'refresh-1' },
      { skipUnauthorizedHandling: true },
    )
    expect(update).toHaveBeenCalledWith({
      accessToken: 'novo-access',
      refreshToken: 'novo-refresh',
    })
    expect(httpClient.setAuthToken).toHaveBeenCalledWith('novo-access')
    expect(result).toBe('novo-access')
    expect(clearClientSession).not.toHaveBeenCalled()
  })

  it('quando o endpoint de refresh falha, limpa a sessão e redireciona pro login', async () => {
    mockSession({ accessToken: 'stale', refreshToken: 'refresh-1' })
    vi.mocked(httpClient.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    })

    renderHook(() => useHttpClientSessionSync())

    const handler = getRegisteredHandler()
    const result = await handler?.()

    expect(result).toBeNull()
    expect(clearClientSession).toHaveBeenCalledTimes(1)
    expect(router.replace).toHaveBeenCalledWith('/login')
  })

  it('remove o handler de 401 ao desmontar', () => {
    mockSession({ accessToken: 'token-1' })
    const { unmount } = renderHook(() => useHttpClientSessionSync())

    unmount()

    expect(httpClient.setUnauthorizedHandler).toHaveBeenLastCalledWith(null)
  })
  it('renews a platform session through its own endpoint', async () => {
    const update = vi
      .fn()
      .mockResolvedValue({ accessToken: 'new-platform', refreshToken: 'new-refresh' })
    mockSession(
      { scope: 'platform', accessToken: 'stale', refreshToken: 'platform-refresh' },
      update,
    )
    vi.mocked(httpClient.post).mockResolvedValueOnce({
      accessToken: 'new-platform',
      refreshToken: 'new-refresh',
    })
    renderHook(() => useHttpClientSessionSync())
    expect(await getRegisteredHandler()?.()).toBe('new-platform')
    expect(httpClient.post).toHaveBeenCalledWith(
      '/platform/refresh',
      { refreshToken: 'platform-refresh' },
      { skipUnauthorizedHandling: true },
    )
    expect(update).toHaveBeenCalledWith({
      accessToken: 'new-platform',
      refreshToken: 'new-refresh',
    })
  })

  it('redirects an expired platform session to the platform login', async () => {
    mockSession({ scope: 'platform', refreshToken: 'invalid-platform-refresh' })
    vi.mocked(httpClient.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    })
    renderHook(() => useHttpClientSessionSync())
    expect(await getRegisteredHandler()?.()).toBeNull()
    expect(router.replace).toHaveBeenCalledWith('/platform/login')
  })

  it.each([429, 500, 503, undefined])(
    'preserves the session during a temporary refresh failure (%s)',
    async (status) => {
      mockSession({ scope: 'tenant', refreshToken: 'refresh-token' })
      vi.mocked(httpClient.post).mockRejectedValueOnce({
        isAxiosError: true,
        response: status ? { status } : undefined,
      })
      renderHook(() => useHttpClientSessionSync())
      expect(await getRegisteredHandler()?.()).toBeNull()
      expect(clearClientSession).not.toHaveBeenCalled()
      expect(router.replace).not.toHaveBeenCalled()
    },
  )
  it('blocks transport and never logs out an unavailable session that temporarily has no public refresh token', async () => {
    mockSession({ authUnavailable: true })
    renderHook(() => useHttpClientSessionSync())
    expect(httpClient.setAuthUnavailable).toHaveBeenCalledWith(true)
    expect(httpClient.setAuthToken).toHaveBeenCalledWith(null)
    expect(await getRegisteredHandler()?.()).toBeNull()
    expect(clearClientSession).not.toHaveBeenCalled()
    expect(httpClient.post).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('does not install raw rotated tokens if their NextAuth validation is unavailable', async () => {
    const update = vi.fn().mockResolvedValue({ authUnavailable: true })
    mockSession({ scope: 'tenant', accessToken: 'old', refreshToken: 'old-refresh' }, update)
    vi.mocked(httpClient.post).mockResolvedValueOnce({
      accessToken: 'fresh',
      refreshToken: 'fresh-refresh',
    })
    renderHook(() => useHttpClientSessionSync())
    expect(await getRegisteredHandler()?.()).toBeNull()
    expect(httpClient.setAuthUnavailable).toHaveBeenLastCalledWith(true)
    expect(httpClient.setAuthToken).not.toHaveBeenCalledWith('fresh')
    expect(clearClientSession).not.toHaveBeenCalled()
  })

  it('restores transport only when the public session is successfully revalidated', () => {
    mockSession({ authUnavailable: true })
    const { rerender } = renderHook(() => useHttpClientSessionSync())
    mockSession({ scope: 'tenant', accessToken: 'revalidated', refreshToken: 'refresh' })
    rerender()
    expect(httpClient.setAuthUnavailable).toHaveBeenLastCalledWith(false)
    expect(httpClient.setAuthToken).toHaveBeenLastCalledWith('revalidated')
  })
})
