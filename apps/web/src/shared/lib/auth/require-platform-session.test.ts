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
  const { requirePlatformSession } = await import('./require-platform-session')
  return requirePlatformSession
}

describe('requirePlatformSession', () => {
  it('retorna a sessão quando o usuário está autenticado com scope platform', async () => {
    const session = { scope: 'platform' }
    getServerSessionMock.mockResolvedValueOnce(session)

    const requirePlatformSession = await getRequirePlatformSession()
    const result = await requirePlatformSession()

    expect(result).toBe(session)
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('redireciona para /platform/login quando não há sessão', async () => {
    getServerSessionMock.mockResolvedValueOnce(null)

    const requirePlatformSession = await getRequirePlatformSession()

    await expect(requirePlatformSession()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirectMock).toHaveBeenCalledWith('/platform/login')
  })

  it('redireciona para /platform/login quando a sessão é de um tenant (não é platform)', async () => {
    getServerSessionMock.mockResolvedValueOnce({ scope: 'tenant', tenantId: 't1', papel: 'ADMIN' })

    const requirePlatformSession = await getRequirePlatformSession()

    await expect(requirePlatformSession()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirectMock).toHaveBeenCalledWith('/platform/login')
  })
})
