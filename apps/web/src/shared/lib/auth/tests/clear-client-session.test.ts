import type { Session } from 'next-auth'
import { getSession, signOut } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearClientSession } from '../clear-client-session'

vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
}))

function mockSession(overrides: Partial<Session>): Session {
  return { user: { id: 'u1' }, expires: '2099-01-01T00:00:00.000Z', ...overrides }
}

describe('clearClientSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(signOut).mockResolvedValue(undefined as never)
    vi.mocked(getSession).mockResolvedValue(null)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true } as Response))
    localStorage.setItem('some-key', 'some-value')
    sessionStorage.setItem('other-key', 'other-value')
  })

  it('limpa localStorage, sessionStorage e encerra a sessão do NextAuth', async () => {
    await clearClientSession()

    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
  })

  it('revoga o refresh token no servidor quando a sessão é de tenant', async () => {
    vi.mocked(getSession).mockResolvedValue(
      mockSession({ scope: 'tenant', refreshToken: 'refresh-fake' }),
    )

    await clearClientSession()

    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'refresh-fake' }),
      }),
    )
  })

  it('não tenta revogar quando a sessão é de plataforma (refresh token vive noutro repositório)', async () => {
    vi.mocked(getSession).mockResolvedValue(
      mockSession({ scope: 'platform', refreshToken: 'refresh-fake' }),
    )

    await clearClientSession()

    expect(fetch).not.toHaveBeenCalled()
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
  })

  it('não tenta revogar quando a sessão de tenant não tem refresh token', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession({ scope: 'tenant' }))

    await clearClientSession()

    expect(fetch).not.toHaveBeenCalled()
  })

  it('não tenta revogar quando não há sessão', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    await clearClientSession()

    expect(fetch).not.toHaveBeenCalled()
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
  })

  it('não lança e ainda encerra a sessão quando getSession falha', async () => {
    vi.mocked(getSession).mockRejectedValue(new Error('network down'))

    await expect(clearClientSession()).resolves.toBeUndefined()
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
  })

  it('não lança e ainda encerra a sessão quando a chamada de revogação falha', async () => {
    vi.mocked(getSession).mockResolvedValue(
      mockSession({ scope: 'tenant', refreshToken: 'refresh-fake' }),
    )
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    await expect(clearClientSession()).resolves.toBeUndefined()
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
  })

  it('não lança mesmo se localStorage/sessionStorage não estiverem disponíveis', async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      throw new Error('blocked')
    })

    await expect(clearClientSession()).resolves.toBeUndefined()
    expect(signOut).toHaveBeenCalledWith({ redirect: false })

    localStorageSpy.mockRestore()
  })
})
