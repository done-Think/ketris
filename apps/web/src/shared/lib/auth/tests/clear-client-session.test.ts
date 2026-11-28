import type { Session } from 'next-auth'
import { getSession, signOut } from 'next-auth/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearClientSession } from '../clear-client-session'
import { localOnlyLogoutEvent } from '../session-lifecycle'
import { reportLogoutRevocationFailure } from '@shared/lib/telemetry/session-telemetry'
import { httpClient } from '@shared/lib/api/http-client'

vi.mock('@shared/lib/api/http-client', () => ({ httpClient: { post: vi.fn() } }))

vi.mock('@shared/lib/telemetry/session-telemetry', () => ({
  reportLogoutRevocationFailure: vi.fn(),
}))

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
    vi.mocked(httpClient.post).mockResolvedValue(undefined)
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('armazenamento local', () => {
    const draftKey = 'maintenance-draft:v1:tenant-a:user-1'

    beforeEach(() => {
      localStorage.setItem('nextauth.message', '{"event":"session"}')
      sessionStorage.setItem('nextauth.message', '{"event":"session"}')
      localStorage.setItem(draftKey, '{"title":"Vazamento"}')
      localStorage.setItem('ketris-sidebar-preferences', '{"state":{"isCollapsed":true}}')
      localStorage.setItem('ketris.crm.pipeline.viewMode', 'list')
      localStorage.setItem('unrelated-key', 'kept')
      sessionStorage.setItem('unrelated-session-key', 'kept')
    })

    it('no logout manual remove a sessão e o rascunho de chamado, mas mantém as preferências de UI', async () => {
      await clearClientSession({ reason: 'manual' })

      expect(localStorage.getItem('nextauth.message')).toBeNull()
      expect(sessionStorage.getItem('nextauth.message')).toBeNull()
      expect(localStorage.getItem(draftKey)).toBeNull()
      expect(localStorage.getItem('ketris-sidebar-preferences')).not.toBeNull()
      expect(localStorage.getItem('ketris.crm.pipeline.viewMode')).toBe('list')
      expect(localStorage.getItem('unrelated-key')).toBe('kept')
      expect(sessionStorage.getItem('unrelated-session-key')).toBe('kept')
      expect(signOut).toHaveBeenCalledWith({ redirect: false })
    })

    it('no logout forçado remove só a sessão e mantém rascunho de chamado e preferências de UI', async () => {
      await clearClientSession({ reason: 'forced' })

      expect(localStorage.getItem('nextauth.message')).toBeNull()
      expect(sessionStorage.getItem('nextauth.message')).toBeNull()
      expect(localStorage.getItem(draftKey)).toBe('{"title":"Vazamento"}')
      expect(localStorage.getItem('ketris-sidebar-preferences')).not.toBeNull()
      expect(localStorage.getItem('ketris.crm.pipeline.viewMode')).toBe('list')
      expect(signOut).toHaveBeenCalledWith({ redirect: false })
    })
  })

  it('revoga o refresh token no servidor quando a sessão é de tenant', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession({ scope: 'tenant' }))

    await clearClientSession({ reason: 'manual' })

    expect(httpClient.post).toHaveBeenCalledWith('/session/logout', undefined, {
      skipUnauthorizedHandling: true,
    })
  })

  it('revoga o refresh token de plataforma pelo mesmo endpoint de sessão do servidor', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession({ scope: 'platform' }))

    await clearClientSession({ reason: 'manual' })

    expect(httpClient.post).toHaveBeenCalledWith('/session/logout', undefined, {
      skipUnauthorizedHandling: true,
    })
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
  })

  it('não tenta revogar quando a sessão não tem escopo (indisponível ou encerrada)', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession({}))

    await clearClientSession({ reason: 'manual' })

    expect(httpClient.post).not.toHaveBeenCalled()
  })

  it('não tenta revogar quando não há sessão', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    await clearClientSession({ reason: 'manual' })

    expect(httpClient.post).not.toHaveBeenCalled()
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
  })

  it('não lança e ainda encerra a sessão quando getSession falha', async () => {
    vi.mocked(getSession).mockRejectedValue(new Error('network down'))

    await expect(clearClientSession({ reason: 'manual' })).resolves.toBeUndefined()
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
  })

  it('não lança e ainda encerra a sessão quando a chamada de revogação falha', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession({ scope: 'tenant' }))
    vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('network down'))

    await expect(clearClientSession({ reason: 'manual' })).resolves.toBeUndefined()
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
  })

  it('não lança mesmo se localStorage/sessionStorage não estiverem disponíveis', async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    await expect(clearClientSession({ reason: 'manual' })).resolves.toBeUndefined()
    expect(signOut).toHaveBeenCalledWith({ redirect: false })

    localStorageSpy.mockRestore()
  })

  describe('server-side revocation failure', () => {
    const noticeListener = vi.fn()

    beforeEach(() => {
      noticeListener.mockReset()
      window.addEventListener(localOnlyLogoutEvent, noticeListener)
      vi.mocked(getSession).mockResolvedValue(mockSession({ scope: 'tenant' }))
    })

    afterEach(() => window.removeEventListener(localOnlyLogoutEvent, noticeListener))

    it.each([
      ['503', { isAxiosError: true, response: { status: 503 } }],
      ['429', { isAxiosError: true, response: { status: 429 } }],
      ['network failure', new Error('network down')],
    ])(
      'reports the failure and warns the user on %s while still signing out',
      async (_name, error) => {
        vi.mocked(httpClient.post).mockRejectedValueOnce(error)

        await expect(clearClientSession({ reason: 'manual' })).resolves.toBeUndefined()

        expect(reportLogoutRevocationFailure).toHaveBeenCalledWith(error)
        expect(noticeListener).toHaveBeenCalledTimes(1)
        expect(signOut).toHaveBeenCalledWith({ redirect: false })
      },
    )

    it('does not warn nor report when the revocation succeeds', async () => {
      await clearClientSession({ reason: 'manual' })

      expect(reportLogoutRevocationFailure).not.toHaveBeenCalled()
      expect(noticeListener).not.toHaveBeenCalled()
      expect(signOut).toHaveBeenCalledWith({ redirect: false })
    })

    it('does not warn when there was no server session to revoke', async () => {
      vi.mocked(getSession).mockResolvedValue(null)

      await clearClientSession({ reason: 'manual' })

      expect(noticeListener).not.toHaveBeenCalled()
    })
  })
})
