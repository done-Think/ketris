import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRouter } from '@/i18n/navigation'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'

import { httpClient } from './http-client'
import { useHttpClientSessionSync } from './use-http-client-session-sync'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/i18n/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@shared/lib/auth/clear-client-session', () => ({
  clearClientSession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./http-client', () => ({
  httpClient: {
    setAuthToken: vi.fn(),
    setTenant: vi.fn(),
    setUnauthorizedHandler: vi.fn(),
  },
}))

const router = { replace: vi.fn(), refresh: vi.fn() }

function mockSession(
  overrides: Partial<{ accessToken: string; refreshToken: string; tenantId: string }>,
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
    vi.stubGlobal('fetch', vi.fn())
  })

  it('sincroniza accessToken e tenantId da sessão pro httpClient', () => {
    mockSession({ accessToken: 'token-1', tenantId: 'tenant-1' })

    renderHook(() => useHttpClientSessionSync())

    expect(httpClient.setAuthToken).toHaveBeenCalledWith('token-1')
    expect(httpClient.setTenant).toHaveBeenCalledWith('tenant-1')
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
    const update = vi.fn()
    mockSession({ accessToken: 'stale', refreshToken: 'refresh-1' }, update)
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'novo-access', refreshToken: 'novo-refresh' }),
    } as Response)

    renderHook(() => useHttpClientSessionSync())

    const handler = getRegisteredHandler()
    const result = await handler?.()

    expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'refresh-1' }),
    })
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
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response)

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
})
