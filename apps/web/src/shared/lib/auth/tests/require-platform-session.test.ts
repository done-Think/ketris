import { describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const redirectMock = vi.fn(() => {
  throw new Error('NEXT_REDIRECT')
})

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

async function getRequirePlatformSession() {
  const { requirePlatformSession } = await import('../require-platform-session')
  return requirePlatformSession
}

describe('requirePlatformSession', () => {
  it('retorna a sessão quando o usuário está autenticado com scope platform', async () => {
    const session = { scope: 'platform' }
    getServerSessionMock.mockResolvedValueOnce(session)

    const requirePlatformSession = await getRequirePlatformSession()
    const result = await requirePlatformSession('pt-BR')

    expect(result).toBe(session)
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('redireciona para /platform/login quando não há sessão', async () => {
    getServerSessionMock.mockResolvedValueOnce(null)

    const requirePlatformSession = await getRequirePlatformSession()

    await expect(requirePlatformSession('pt-BR')).rejects.toThrow('NEXT_REDIRECT')
    expect(redirectMock).toHaveBeenCalledWith('/pt/platform/login')
  })

  it('redireciona para /platform/login quando a sessão é de um tenant (não é platform)', async () => {
    getServerSessionMock.mockResolvedValueOnce({ scope: 'tenant', tenantId: 't1', role: 'OWNER' })

    const requirePlatformSession = await getRequirePlatformSession()

    await expect(requirePlatformSession('pt-BR')).rejects.toThrow('NEXT_REDIRECT')
    expect(redirectMock).toHaveBeenCalledWith('/pt/platform/login')
  })
  it('signals temporary unavailability instead of returning authority or redirecting to login', async () => {
    getServerSessionMock.mockResolvedValueOnce({ authUnavailable: true })
    const requireSession = await getRequirePlatformSession()
    await expect(requireSession('pt-BR')).rejects.toMatchObject({
      status: 503,
      code: 'AUTH_UNAVAILABLE',
    })
  })
})
