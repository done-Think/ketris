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

async function getRequireAdminSession() {
  const { requireAdminSession } = await import('./require-admin-session')
  return requireAdminSession
}

describe('requireAdminSession', () => {
  it('retorna a sessão quando o usuário está autenticado com papel ADMIN', async () => {
    const session = { papel: 'ADMIN', tenantId: 'tenant-1' }
    getServerSessionMock.mockResolvedValueOnce(session)

    const requireAdminSession = await getRequireAdminSession()
    const result = await requireAdminSession()

    expect(result).toBe(session)
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('redireciona para /backoffice/login quando não há sessão', async () => {
    getServerSessionMock.mockResolvedValueOnce(null)

    const requireAdminSession = await getRequireAdminSession()

    await expect(requireAdminSession()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirectMock).toHaveBeenCalledWith('/backoffice/login')
  })

  it('redireciona para /backoffice/login quando a sessão não é de um ADMIN', async () => {
    getServerSessionMock.mockResolvedValueOnce({ papel: 'AGENT', tenantId: 'tenant-1' })

    const requireAdminSession = await getRequireAdminSession()

    await expect(requireAdminSession()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirectMock).toHaveBeenCalledWith('/backoffice/login')
  })
})
