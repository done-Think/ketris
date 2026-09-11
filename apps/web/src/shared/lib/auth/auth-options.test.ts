import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCredentialsError } from '@server/auth/domain/errors'
import { InvalidPlatformCredentialsError } from '@server/platform/domain/errors'

const executeMock = vi.fn()
const platformExecuteMock = vi.fn()
const findByIdMock = vi.fn()

vi.mock('@server/auth/container', () => ({
  authContainer: {
    loginUseCase: { execute: executeMock },
    userRepository: { findById: findByIdMock },
  },
}))

vi.mock('@server/platform/container', () => ({
  platformContainer: { loginPlatformAdminUseCase: { execute: platformExecuteMock } },
}))

async function getAuthorize() {
  const { authOptions } = await import('./auth-options')
  const provider = authOptions.providers[0] as unknown as {
    options: { authorize: (credentials: Record<string, string> | undefined) => Promise<unknown> }
  }
  return provider.options.authorize
}

async function getPlatformAuthorize() {
  const { authOptions } = await import('./auth-options')
  const provider = authOptions.providers[1] as unknown as {
    options: { authorize: (credentials: Record<string, string> | undefined) => Promise<unknown> }
  }
  return provider.options.authorize
}

async function getJwtCallback() {
  const { authOptions } = await import('./auth-options')
  return authOptions.callbacks!.jwt!
}

describe('authOptions — CredentialsProvider.authorize', () => {
  it('retorna null quando faltam email ou senha', async () => {
    const authorize = await getAuthorize()

    expect(await authorize(undefined)).toBeNull()
    expect(await authorize({ email: '', password: '' })).toBeNull()
    expect(executeMock).not.toHaveBeenCalled()
  })

  it('chama o LoginUseCase e mapeia o resultado para o formato de usuário do NextAuth', async () => {
    executeMock.mockResolvedValueOnce({
      user: { id: 'u1', tenantId: 't1', nome: 'Ana', email: 'ana@ketris.dev', papel: 'AGENT' },
      accessToken: 'jwt-fake',
      refreshToken: 'refresh-fake',
    })

    const authorize = await getAuthorize()
    const result = await authorize({ email: 'ana@ketris.dev', password: 'segredo123' })

    expect(executeMock).toHaveBeenCalledWith({ email: 'ana@ketris.dev', password: 'segredo123' })
    expect(result).toEqual({
      id: 'u1',
      name: 'Ana',
      email: 'ana@ketris.dev',
      accessToken: 'jwt-fake',
      refreshToken: 'refresh-fake',
      scope: 'tenant',
      tenantId: 't1',
      papel: 'AGENT',
    })
  })

  it('retorna null (não lança) quando as credenciais são inválidas', async () => {
    executeMock.mockRejectedValueOnce(new InvalidCredentialsError())

    const authorize = await getAuthorize()
    const result = await authorize({ email: 'ana@ketris.dev', password: 'senha-errada' })

    expect(result).toBeNull()
  })

  it('propaga erros inesperados (não mascara falhas de infraestrutura como credencial inválida)', async () => {
    executeMock.mockRejectedValueOnce(new Error('banco fora do ar'))

    const authorize = await getAuthorize()

    await expect(authorize({ email: 'ana@ketris.dev', password: 'x' })).rejects.toThrow(
      'banco fora do ar',
    )
  })
})

describe('authOptions — platform-credentials.authorize', () => {
  it('retorna null quando faltam email ou senha', async () => {
    const authorize = await getPlatformAuthorize()

    expect(await authorize(undefined)).toBeNull()
    expect(await authorize({ email: '', password: '' })).toBeNull()
    expect(platformExecuteMock).not.toHaveBeenCalled()
  })

  it('chama o LoginPlatformAdminUseCase e mapeia o resultado, sem tenantId/papel', async () => {
    platformExecuteMock.mockResolvedValueOnce({
      admin: { id: 'p1', nome: 'Dono', email: 'dono@ketris.dev', ativo: true },
      accessToken: 'jwt-platform-fake',
      refreshToken: 'refresh-platform-fake',
    })

    const authorize = await getPlatformAuthorize()
    const result = await authorize({ email: 'dono@ketris.dev', password: 'segredo123' })

    expect(platformExecuteMock).toHaveBeenCalledWith({
      email: 'dono@ketris.dev',
      password: 'segredo123',
    })
    expect(result).toEqual({
      id: 'p1',
      name: 'Dono',
      email: 'dono@ketris.dev',
      accessToken: 'jwt-platform-fake',
      refreshToken: 'refresh-platform-fake',
      scope: 'platform',
    })
    expect(result).not.toHaveProperty('tenantId')
    expect(result).not.toHaveProperty('papel')
  })

  it('retorna null (não lança) quando as credenciais são inválidas', async () => {
    platformExecuteMock.mockRejectedValueOnce(new InvalidPlatformCredentialsError())

    const authorize = await getPlatformAuthorize()
    const result = await authorize({ email: 'dono@ketris.dev', password: 'senha-errada' })

    expect(result).toBeNull()
  })
})

describe('authOptions — callbacks.jwt (revalidação contra o banco)', () => {
  beforeEach(() => {
    findByIdMock.mockClear()
  })

  it('no sign-in inicial, apenas copia os campos do user pro token e não consulta o banco', async () => {
    const jwt = await getJwtCallback()

    const token = await jwt({
      token: { sub: 'u1' },
      user: {
        accessToken: 'a',
        refreshToken: 'r',
        scope: 'tenant',
        tenantId: 't1',
        papel: 'AGENT',
      },
    } as unknown as Parameters<typeof jwt>[0])

    expect(token).toMatchObject({ scope: 'tenant', tenantId: 't1', papel: 'AGENT' })
    expect(findByIdMock).not.toHaveBeenCalled()
  })

  it('mantém o escopo quando o usuário ainda existe, está ativo e pertence ao mesmo tenant', async () => {
    findByIdMock.mockResolvedValueOnce({ id: 'u1', tenantId: 't1', ativo: true })
    const jwt = await getJwtCallback()

    const token = await jwt({
      token: { sub: 'u1', scope: 'tenant', tenantId: 't1', papel: 'AGENT' },
      user: undefined,
    } as unknown as Parameters<typeof jwt>[0])

    expect(token).toMatchObject({ scope: 'tenant', tenantId: 't1', papel: 'AGENT' })
  })

  it('limpa o escopo quando o usuário não existe mais (tenant/usuário apagado)', async () => {
    findByIdMock.mockResolvedValueOnce(null)
    const jwt = await getJwtCallback()

    const token = await jwt({
      token: { sub: 'u1', scope: 'tenant', tenantId: 't1', papel: 'AGENT' },
      user: undefined,
    } as unknown as Parameters<typeof jwt>[0])

    expect(token.scope).toBeUndefined()
    expect(token.tenantId).toBeUndefined()
    expect(token.papel).toBeUndefined()
  })

  it('limpa o escopo quando o usuário foi desativado', async () => {
    findByIdMock.mockResolvedValueOnce({ id: 'u1', tenantId: 't1', ativo: false })
    const jwt = await getJwtCallback()

    const token = await jwt({
      token: { sub: 'u1', scope: 'tenant', tenantId: 't1', papel: 'AGENT' },
      user: undefined,
    } as unknown as Parameters<typeof jwt>[0])

    expect(token.scope).toBeUndefined()
  })

  it('limpa o escopo quando o usuário migrou de tenant e o token ficou com o tenant antigo', async () => {
    findByIdMock.mockResolvedValueOnce({ id: 'u1', tenantId: 't2', ativo: true })
    const jwt = await getJwtCallback()

    const token = await jwt({
      token: { sub: 'u1', scope: 'tenant', tenantId: 't1', papel: 'AGENT' },
      user: undefined,
    } as unknown as Parameters<typeof jwt>[0])

    expect(token.scope).toBeUndefined()
  })

  it('não consulta o banco para sessões de escopo platform', async () => {
    const jwt = await getJwtCallback()

    await jwt({
      token: { sub: 'p1', scope: 'platform' },
      user: undefined,
    } as unknown as Parameters<typeof jwt>[0])

    expect(findByIdMock).not.toHaveBeenCalled()
  })
})
