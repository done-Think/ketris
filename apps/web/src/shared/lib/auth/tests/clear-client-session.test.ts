import { signOut } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearClientSession } from '../clear-client-session'

vi.mock('next-auth/react', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}))

describe('clearClientSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('some-key', 'some-value')
    sessionStorage.setItem('other-key', 'other-value')
  })

  it('limpa localStorage, sessionStorage e encerra a sessão do NextAuth', async () => {
    await clearClientSession()

    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
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
