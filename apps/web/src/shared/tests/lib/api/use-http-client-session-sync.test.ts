import { renderHook } from '@testing-library/react'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

type SessionData = Partial<{
  accessToken: string
  tenantId: string
  scope: 'tenant' | 'platform'
  authUnavailable: boolean
  user: { id: string }
}>

function mockSession(overrides: SessionData, update = vi.fn()) {
  vi.mocked(useSession).mockReturnValue({
    data: { ...overrides },
    status: 'authenticated',
    update,
  } as unknown as ReturnType<typeof useSession>)

  return update
}

function getRegisteredHandler() {
  const call = vi.mocked(httpClient.setUnauthorizedHandler).mock.calls.at(-1)
  return call?.[0] as ((failedAccessToken?: string) => Promise<string | null>) | null
}

describe('useHttpClientSessionSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>)
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
      let finish: () => void = () => undefined
      const update = vi.fn(
        () =>
          new Promise((resolve) => {
            finish = () => resolve(success ? { accessToken: 'old-account-renewed' } : {})
          }),
      )
      mockSession({ accessToken: 'old', tenantId: 'tenant-a' }, update)
      const view = renderHook(() => useHttpClientSessionSync())
      const refresh = getRegisteredHandler()?.()
      mockSession({ accessToken: 'new-account', tenantId: 'tenant-b' })
      view.rerender()
      finish()
      expect(await refresh).toBeNull()
      expect(clearClientSession).not.toHaveBeenCalled()
      expect(httpClient.setAuthToken).toHaveBeenLastCalledWith('new-account')
      expect(httpClient.setAuthToken).not.toHaveBeenCalledWith('old-account-renewed')
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
      let finish: () => void = () => undefined
      const update = vi.fn(
        () =>
          new Promise((resolve) => {
            finish = () => resolve(success ? { accessToken: 'renewed-a' } : {})
          }),
      )
      mockSession({ accessToken: 'token-a', tenantId: 'tenant-a' }, update)
      const previous = renderHook(() => useHttpClientSessionSync())
      const refresh = getRegisteredHandler()?.()
      previous.unmount()
      mockSession({ accessToken: 'token-b', tenantId: 'tenant-b' })
      renderHook(() => useHttpClientSessionSync())
      const currentHandler = getRegisteredHandler()

      finish()

      expect(await refresh).toBeNull()
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
      mockSession({ accessToken: 'token-a', tenantId: 'tenant-a' }, update)
      const previous = renderHook(() => useHttpClientSessionSync())
      const refresh = getRegisteredHandler()?.()
      await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1))
      previous.unmount()
      mockSession({ accessToken: 'token-b', tenantId: 'tenant-b' })
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
    const update = mockSession({ accessToken: 'token-a' })
    const previous = renderHook(() => useHttpClientSessionSync())
    const handler = getRegisteredHandler()
    previous.unmount()

    expect(await handler?.()).toBeNull()
    expect(update).not.toHaveBeenCalled()
  })

  it('sem accessToken, o handler de 401 limpa a sessão e redireciona pro login', async () => {
    const update = mockSession({})
    renderHook(() => useHttpClientSessionSync())

    const result = await getRegisteredHandler()?.()

    expect(result).toBeNull()
    expect(update).not.toHaveBeenCalled()
    expect(clearClientSession).toHaveBeenCalledTimes(1)
    expect(clearClientSession).toHaveBeenCalledWith({ reason: 'forced' })
    expect(router.replace).toHaveBeenCalledWith('/login')
    expect(router.refresh).toHaveBeenCalledTimes(1)
  })

  it('refreshes through the server-side session update and never posts a refresh token', async () => {
    const update = vi.fn().mockResolvedValue({ accessToken: 'novo-access' })
    mockSession({ accessToken: 'stale' }, update)
    renderHook(() => useHttpClientSessionSync())

    const result = await getRegisteredHandler()?.('stale')

    expect(update).toHaveBeenCalledWith({ refresh: true })
    expect(httpClient.post).not.toHaveBeenCalled()
    expect(httpClient.setAuthToken).toHaveBeenCalledWith('novo-access')
    expect(result).toBe('novo-access')
    expect(clearClientSession).not.toHaveBeenCalled()
  })

  it('ends the session when the server rejected the refresh token', async () => {
    mockSession({ accessToken: 'stale' }, vi.fn().mockResolvedValue({ user: { id: 'u1' } }))
    renderHook(() => useHttpClientSessionSync())

    expect(await getRegisteredHandler()?.()).toBeNull()
    expect(clearClientSession).toHaveBeenCalledTimes(1)
    expect(clearClientSession).toHaveBeenCalledWith({ reason: 'forced' })
    expect(router.replace).toHaveBeenCalledWith('/login')
  })

  it('remove o handler de 401 ao desmontar', () => {
    mockSession({ accessToken: 'token-1' })
    const { unmount } = renderHook(() => useHttpClientSessionSync())

    unmount()

    expect(httpClient.setUnauthorizedHandler).toHaveBeenLastCalledWith(null)
  })

  it('redirects an expired platform session to the platform login', async () => {
    mockSession({ scope: 'platform', accessToken: 'stale' }, vi.fn().mockResolvedValue({}))
    renderHook(() => useHttpClientSessionSync())
    expect(await getRegisteredHandler()?.()).toBeNull()
    expect(router.replace).toHaveBeenCalledWith('/platform/login')
  })

  it.each([
    ['no answer', () => vi.fn().mockResolvedValue(null)],
    ['a thrown error', () => vi.fn().mockRejectedValue(new Error('network down'))],
    ['an unchanged access token', () => vi.fn().mockResolvedValue({ accessToken: 'stale' })],
  ])('preserves the session during a temporary refresh failure (%s)', async (_name, build) => {
    mockSession({ scope: 'tenant', accessToken: 'stale' }, build())
    renderHook(() => useHttpClientSessionSync())
    expect(await getRegisteredHandler()?.()).toBeNull()
    expect(clearClientSession).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('blocks transport and never logs out an unavailable session that temporarily has no public access token', async () => {
    const update = mockSession({ authUnavailable: true })
    renderHook(() => useHttpClientSessionSync())
    expect(httpClient.setAuthUnavailable).toHaveBeenCalledWith(true)
    expect(httpClient.setAuthToken).toHaveBeenCalledWith(null)
    expect(await getRegisteredHandler()?.()).toBeNull()
    expect(clearClientSession).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('does not install rotated tokens if their NextAuth validation is unavailable', async () => {
    const update = vi.fn().mockResolvedValue({ authUnavailable: true })
    mockSession({ scope: 'tenant', accessToken: 'old' }, update)
    renderHook(() => useHttpClientSessionSync())
    expect(await getRegisteredHandler()?.()).toBeNull()
    expect(httpClient.setAuthUnavailable).toHaveBeenLastCalledWith(true)
    expect(httpClient.setAuthToken).toHaveBeenLastCalledWith(null)
    expect(clearClientSession).not.toHaveBeenCalled()
  })

  it('restores transport only when the public session is successfully revalidated', () => {
    mockSession({ authUnavailable: true })
    const { rerender } = renderHook(() => useHttpClientSessionSync())
    mockSession({ scope: 'tenant', accessToken: 'revalidated' })
    rerender()
    expect(httpClient.setAuthUnavailable).toHaveBeenLastCalledWith(false)
    expect(httpClient.setAuthToken).toHaveBeenLastCalledWith('revalidated')
  })

  describe('rotated sessions', () => {
    it('reuses the rotated session for a late 401 instead of refreshing again', async () => {
      const update = vi.fn().mockResolvedValue({ accessToken: 'a2' })
      mockSession({ accessToken: 'a1' }, update)
      renderHook(() => useHttpClientSessionSync())
      const handler = getRegisteredHandler()

      expect(await handler?.('a1')).toBe('a2')
      expect(await handler?.('a1')).toBe('a2')

      expect(update).toHaveBeenCalledTimes(1)
      expect(clearClientSession).not.toHaveBeenCalled()
    })

    it('keeps refreshing from the latest session even before React re-registers the handler', async () => {
      const update = vi
        .fn()
        .mockResolvedValueOnce({ accessToken: 'a2' })
        .mockResolvedValueOnce({ accessToken: 'a3' })
      mockSession({ accessToken: 'a1' }, update)
      renderHook(() => useHttpClientSessionSync())
      const handler = getRegisteredHandler()

      await handler?.('a1')
      expect(await handler?.('a2')).toBe('a3')

      expect(update).toHaveBeenCalledTimes(2)
      expect(clearClientSession).not.toHaveBeenCalled()
    })

    it('does not log out when another tab already rotated the session before the answer arrives', async () => {
      let finish: () => void = () => undefined
      const update = vi.fn(
        () =>
          new Promise((resolve) => {
            finish = () => resolve({ user: { id: 'u1' } })
          }),
      )
      mockSession({ accessToken: 'a1', user: { id: 'u1' } }, update)
      const view = renderHook(() => useHttpClientSessionSync())
      const refresh = getRegisteredHandler()?.('a1')
      mockSession({ accessToken: 'a2', user: { id: 'u1' } })
      view.rerender()

      finish()

      expect(await refresh).toBe('a2')
      expect(clearClientSession).not.toHaveBeenCalled()
      expect(router.replace).not.toHaveBeenCalled()
    })

    it('does not reuse the session of another account for a stale 401', async () => {
      const update = vi.fn().mockResolvedValue(null)
      mockSession({ accessToken: 'a1', tenantId: 'tenant-a' }, update)
      const view = renderHook(() => useHttpClientSessionSync())
      mockSession({ accessToken: 'b1', tenantId: 'tenant-b' }, update)
      view.rerender()

      expect(await getRegisteredHandler()?.('a1')).toBeNull()
      expect(update).toHaveBeenCalledTimes(1)
    })
  })

  describe('cross-tab serialization', () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, 'locks')
    })

    it('runs the refresh inside an exclusive Web Lock when the browser supports it', async () => {
      const request = vi.fn(async (_name: string, task: () => Promise<unknown>) => task())
      Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true })
      mockSession({ accessToken: 'a1' }, vi.fn().mockResolvedValue({ accessToken: 'a2' }))
      renderHook(() => useHttpClientSessionSync())

      expect(await getRegisteredHandler()?.('a1')).toBe('a2')
      expect(request).toHaveBeenCalledWith('ketris-session-refresh', expect.any(Function))
    })
  })
})
