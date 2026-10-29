import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AccountDeactivatedError, InvalidCredentialsError } from '@server/auth/domain/errors'
import { InvalidPlatformCredentialsError } from '@server/platform/domain/errors'
import { UnauthorizedError } from '@server/shared/errors'

const executeMock = vi.fn()
const platformExecuteMock = vi.fn()
const platformFindByIdMock = vi.fn()
const platformValidatePairMock = vi.fn()
const findByIdMock = vi.fn()
const verifyTokenMock = vi.fn()

vi.mock('@server/auth/container', () => ({
  authContainer: {
    loginUseCase: { execute: executeMock },
    userRepository: { findById: findByIdMock },
    tokenService: { verify: verifyTokenMock },
    validateSessionTokensUseCase: { execute: verifyTokenMock },
  },
}))

vi.mock('@server/platform/container', () => ({
  platformContainer: {
    loginPlatformAdminUseCase: { execute: platformExecuteMock },
    platformAdminRepository: { findById: platformFindByIdMock },
    validatePlatformSessionTokensUseCase: { execute: platformValidatePairMock },
  },
}))

async function getProviderAuthorize(id: string) {
  const { authOptions } = await import('../auth-options')
  const provider = authOptions.providers.find(
    (candidate) => (candidate as unknown as { options: { id: string } }).options.id === id,
  ) as unknown as {
    options: { authorize: (credentials: Record<string, string> | undefined) => Promise<unknown> }
  }
  return provider.options.authorize
}

function getAuthorize() {
  return getProviderAuthorize('credentials')
}

function getTokenSessionAuthorize() {
  return getProviderAuthorize('token-session')
}

function getPlatformAuthorize() {
  return getProviderAuthorize('platform-credentials')
}

async function getJwtCallback() {
  const { authOptions } = await import('../auth-options')
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
      user: { id: 'u1', tenantId: 't1', name: 'Ana', email: 'ana@ketris.dev', role: 'AGENT' },
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
      role: 'AGENT',
      sessionVersion: 0,
    })
  })

  it('retorna null (não lança) quando as credenciais são inválidas', async () => {
    executeMock.mockRejectedValueOnce(new InvalidCredentialsError())

    const authorize = await getAuthorize()
    const result = await authorize({ email: 'ana@ketris.dev', password: 'senha-errada' })

    expect(result).toBeNull()
  })

  it('retorna null (não lança) quando a conta está desativada', async () => {
    executeMock.mockRejectedValueOnce(new AccountDeactivatedError())

    const authorize = await getAuthorize()
    const result = await authorize({ email: 'ana@ketris.dev', password: 'segredo123' })

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

describe('authOptions — token-session.authorize', () => {
  it('retorna null quando faltam accessToken ou refreshToken', async () => {
    const authorize = await getTokenSessionAuthorize()

    expect(await authorize(undefined)).toBeNull()
    expect(await authorize({ accessToken: '', refreshToken: '' })).toBeNull()
    expect(verifyTokenMock).not.toHaveBeenCalled()
  })

  it('verifica o access token e monta a sessão sem checar senha', async () => {
    verifyTokenMock.mockResolvedValueOnce({ sub: 'u1', tenantId: 't1', role: 'AGENT' })
    findByIdMock.mockResolvedValueOnce({
      id: 'u1',
      tenantId: 't1',
      name: 'Ana',
      email: 'ana@ketris.dev',
      role: 'AGENT',
      active: true,
    })

    const authorize = await getTokenSessionAuthorize()
    const result = await authorize({ accessToken: 'token-valido', refreshToken: 'refresh-valido' })

    expect(verifyTokenMock).toHaveBeenCalledWith('token-valido', 'refresh-valido')
    expect(result).toEqual({
      id: 'u1',
      name: 'Ana',
      email: 'ana@ketris.dev',
      accessToken: 'token-valido',
      refreshToken: 'refresh-valido',
      scope: 'tenant',
      tenantId: 't1',
      role: 'AGENT',
      sessionVersion: 0,
    })
  })

  it('retorna null quando o access token é inválido ou expirado', async () => {
    verifyTokenMock.mockRejectedValueOnce(new UnauthorizedError())

    const authorize = await getTokenSessionAuthorize()
    const result = await authorize({ accessToken: 'token-expirado', refreshToken: 'r' })

    expect(result).toBeNull()
  })

  it('retorna null quando o usuário do token não existe mais', async () => {
    verifyTokenMock.mockResolvedValueOnce({ sub: 'u1', tenantId: 't1', role: 'AGENT' })
    findByIdMock.mockResolvedValueOnce(null)

    const authorize = await getTokenSessionAuthorize()
    const result = await authorize({ accessToken: 'token-valido', refreshToken: 'r' })

    expect(result).toBeNull()
  })

  it('retorna null quando o usuário do token foi desativado', async () => {
    verifyTokenMock.mockResolvedValueOnce({ sub: 'u1', tenantId: 't1', role: 'AGENT' })
    findByIdMock.mockResolvedValueOnce({
      id: 'u1',
      tenantId: 't1',
      name: 'Ana',
      email: 'ana@ketris.dev',
      role: 'AGENT',
      active: false,
    })

    const authorize = await getTokenSessionAuthorize()
    const result = await authorize({ accessToken: 'token-valido', refreshToken: 'r' })

    expect(result).toBeNull()
  })
})

describe('authOptions — platform-credentials.authorize', () => {
  it('retorna null quando faltam email ou senha', async () => {
    const authorize = await getPlatformAuthorize()

    expect(await authorize(undefined)).toBeNull()
    expect(await authorize({ email: '', password: '' })).toBeNull()
    expect(platformExecuteMock).not.toHaveBeenCalled()
  })

  it('chama o LoginPlatformAdminUseCase e mapeia o resultado, sem tenantId/role', async () => {
    platformExecuteMock.mockResolvedValueOnce({
      admin: { id: 'p1', name: 'Dono', email: 'dono@ketris.dev', active: true },
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
    expect(result).not.toHaveProperty('role')
  })

  it('retorna null (não lança) quando as credenciais são inválidas', async () => {
    platformExecuteMock.mockRejectedValueOnce(new InvalidPlatformCredentialsError())

    const authorize = await getPlatformAuthorize()
    const result = await authorize({ email: 'dono@ketris.dev', password: 'senha-errada' })

    expect(result).toBeNull()
  })
})

const currentUser = {
  id: 'u1',
  tenantId: 't1',
  role: 'AGENT',
  active: true,
  name: 'Ana',
  email: 'ana@ketris.dev',
  avatarUrl: null,
  membershipApprovedAt: new Date(),
  emailVerifiedAt: new Date(),
  tenantStatus: 'ACTIVE',
  sessionVersion: 2,
}
const currentToken = {
  sub: 'u1',
  scope: 'tenant',
  tenantId: 't1',
  role: 'AGENT',
  sessionVersion: 2,
  accessToken: 'stale-access',
  refreshToken: 'stale-refresh',
}

describe('authOptions — callbacks.jwt', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    findByIdMock.mockResolvedValue(currentUser)
    platformFindByIdMock.mockResolvedValue({
      id: 'p1',
      active: true,
      name: 'Platform',
      email: 'platform@example.test',
    })
    platformValidatePairMock.mockRejectedValue(new UnauthorizedError())
  })

  async function run(token = currentToken, extra: Record<string, unknown> = {}) {
    const jwt = await getJwtCallback()
    return jwt({ token: { ...token }, ...extra } as unknown as Parameters<typeof jwt>[0])
  }

  it('copies trusted provider claims on initial sign-in', async () => {
    const token = await run(currentToken, { user: { ...currentToken, sessionVersion: 3 } })
    expect(token).toMatchObject({ role: 'AGENT', sessionVersion: 3 })
    expect(findByIdMock).not.toHaveBeenCalled()
  })

  it.each(['ACTIVE', 'TRIAL'])('keeps a current session in tenant %s', async (tenantStatus) => {
    findByIdMock.mockResolvedValueOnce({ ...currentUser, tenantStatus })
    expect(await run()).toMatchObject(currentToken)
  })

  it.each([
    null,
    { ...currentUser, active: false },
    { ...currentUser, tenantId: 't2' },
    { ...currentUser, role: 'OWNER' },
    { ...currentUser, sessionVersion: 3 },
    { ...currentUser, emailVerifiedAt: null },
    { ...currentUser, membershipApprovedAt: null },
    { ...currentUser, tenantStatus: 'SUSPENDED' },
    { ...currentUser, tenantStatus: 'CANCELED' },
  ])('clears all credentials when the current account loses access: %j', async (user) => {
    findByIdMock.mockResolvedValueOnce(user)
    const token = await run()
    expect(token.scope).toBeUndefined()
    expect(token.role).toBeUndefined()
    expect(token.tenantId).toBeUndefined()
    expect(token.accessToken).toBeUndefined()
    expect(token.refreshToken).toBeUndefined()
  })

  it('revalidates access on update before accepting any new tokens', async () => {
    findByIdMock.mockResolvedValueOnce({ ...currentUser, sessionVersion: 3 })
    const token = await run(currentToken, {
      trigger: 'update',
      session: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' },
    })
    expect(token.scope).toBeUndefined()
    expect(verifyTokenMock).not.toHaveBeenCalled()
  })

  it('accepts a validated pair for the same user and tenant', async () => {
    verifyTokenMock.mockResolvedValueOnce({
      sub: 'u1',
      tenantId: 't1',
      role: 'AGENT',
      sessionVersion: 2,
    })
    const token = await run(currentToken, {
      trigger: 'update',
      session: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' },
    })
    expect(verifyTokenMock).toHaveBeenCalledWith('fresh-access', 'fresh-refresh')
    expect(token).toMatchObject({ accessToken: 'fresh-access', refreshToken: 'fresh-refresh' })
  })

  it.each([
    { sub: 'other-user', tenantId: 't1' },
    { sub: 'u1', tenantId: 'other-tenant' },
    { sub: 'u1', tenantId: 't1', role: 'OWNER', sessionVersion: 2 },
    { sub: 'u1', tenantId: 't1', role: 'AGENT', sessionVersion: 3 },
  ])('rejects another identity in a session update: %j', async (payload) => {
    verifyTokenMock.mockResolvedValueOnce(payload)
    expect(
      await run(currentToken, {
        trigger: 'update',
        session: { accessToken: 'foreign-access', refreshToken: 'foreign-refresh' },
      }),
    ).toMatchObject(currentToken)
  })

  it('ignores invalid token pairs and client-supplied profile identity', async () => {
    verifyTokenMock.mockRejectedValueOnce(new UnauthorizedError())
    expect(
      await run(currentToken, {
        trigger: 'update',
        session: {
          accessToken: 'forged-access',
          refreshToken: 'forged-refresh',
          user: { name: 'Forged', email: 'forged@example.test', image: 'forged' },
        },
      }),
    ).toMatchObject({
      ...currentToken,
      name: currentUser.name,
      email: currentUser.email,
      picture: null,
    })
  })

  it('reloads profile data from the database on a token-free update', async () => {
    expect(await run(currentToken, { trigger: 'update', session: {} })).toMatchObject({
      name: currentUser.name,
      email: currentUser.email,
      picture: null,
    })
    expect(verifyTokenMock).not.toHaveBeenCalled()
  })

  it('preserves an expired access token and refresh token for the client renewal bridge', async () => {
    expect(await run()).toMatchObject(currentToken)
    expect(verifyTokenMock).not.toHaveBeenCalled()
  })

  it('preserves private session tokens and marks a database outage without throwing', async () => {
    findByIdMock.mockRejectedValueOnce(new Error('database unavailable'))
    expect(await run()).toMatchObject({ ...currentToken, authUnavailable: true })
  })

  it('keeps a pending rotated pair private during an outage and validates it before recovery', async () => {
    verifyTokenMock.mockRejectedValueOnce(new Error('database unavailable'))
    const blocked = await run(currentToken, {
      trigger: 'update',
      session: { accessToken: 'fresh', refreshToken: 'fresh-refresh' },
    })
    expect(blocked).toMatchObject({
      ...currentToken,
      authUnavailable: true,
      pendingAccessToken: 'fresh',
      pendingRefreshToken: 'fresh-refresh',
    })
    verifyTokenMock.mockResolvedValueOnce({
      sub: 'u1',
      tenantId: 't1',
      role: 'AGENT',
      sessionVersion: 2,
    })
    const recovered = await run(blocked as typeof currentToken)
    expect(recovered.authUnavailable).toBeUndefined()
    expect(recovered.pendingRefreshToken).toBeUndefined()
    expect(recovered).toMatchObject({ accessToken: 'fresh', refreshToken: 'fresh-refresh' })
  })

  it('recovers from a temporary database outage only after checking the current account again', async () => {
    findByIdMock.mockRejectedValueOnce(new Error('database unavailable'))
    const blocked = await run()
    const recovered = await run(blocked as typeof currentToken)
    expect(recovered).toMatchObject(currentToken)
    expect(recovered.authUnavailable).toBeUndefined()
    expect(findByIdMock).toHaveBeenCalledTimes(2)
  })

  it('clears a session revoked during an outage instead of restoring its old authority', async () => {
    findByIdMock.mockRejectedValueOnce(new Error('database unavailable'))
    const blocked = await run()
    findByIdMock.mockResolvedValueOnce({ ...currentUser, sessionVersion: 3 })
    const revoked = await run(blocked as typeof currentToken)
    expect(revoked.scope).toBeUndefined()
    expect(revoked.accessToken).toBeUndefined()
    expect(revoked.refreshToken).toBeUndefined()
    expect(revoked.authUnavailable).toBeUndefined()
  })

  it('exposes identity but no tokens, role, scope or tenant while authentication is unavailable', async () => {
    const { authOptions } = await import('../auth-options')
    const callback = authOptions.callbacks!.session!
    const result = await callback({
      session: { user: { id: 'u1' }, expires: '2099-01-01' },
      token: {
        ...currentToken,
        authUnavailable: true,
        pendingAccessToken: 'candidate',
        pendingRefreshToken: 'candidate-refresh',
      },
    } as unknown as Parameters<typeof callback>[0])
    expect(result).toMatchObject({ authUnavailable: true, user: { id: 'u1' } })
    expect(result).not.toHaveProperty('accessToken', expect.anything())
    expect(result).not.toHaveProperty('refreshToken', expect.anything())
    expect(result).not.toHaveProperty('scope', expect.anything())
    expect(result).not.toHaveProperty('tenantId', expect.anything())
    expect(result).not.toHaveProperty('role', expect.anything())
    expect(result).not.toHaveProperty('pendingAccessToken')
  })

  it('never adopts a foreign candidate after the database returns', async () => {
    findByIdMock.mockRejectedValueOnce(new Error('database unavailable'))
    const blocked = await run(currentToken, {
      trigger: 'update',
      session: { accessToken: 'foreign', refreshToken: 'foreign-refresh', role: 'OWNER' },
    })
    verifyTokenMock.mockResolvedValueOnce({
      sub: 'foreign-user',
      tenantId: 't1',
      role: 'OWNER',
      sessionVersion: 2,
    })
    const recovered = await run(blocked as typeof currentToken)
    expect(recovered).toMatchObject(currentToken)
    expect(recovered.pendingAccessToken).toBeUndefined()
  })

  it('preserves platform cookies without public authority during an outage and recovers afterward', async () => {
    const platformToken = {
      sub: 'p1',
      scope: 'platform',
      accessToken: 'platform',
      refreshToken: 'platform-refresh',
    }
    platformFindByIdMock.mockRejectedValueOnce(new Error('database unavailable'))
    const blocked = await run(platformToken as typeof currentToken)
    expect(blocked).toMatchObject({ ...platformToken, authUnavailable: true })
    const recovered = await run(blocked as typeof currentToken)
    expect(recovered.authUnavailable).toBeUndefined()
    expect(recovered).toMatchObject(platformToken)
  })

  it('does not use the tenant repository for platform sessions or accept unvalidated token updates', async () => {
    const platformToken = {
      sub: 'p1',
      scope: 'platform',
      accessToken: 'platform',
      refreshToken: 'refresh',
    }
    expect(
      await run(platformToken as typeof currentToken, {
        trigger: 'update',
        session: { accessToken: 'forged', refreshToken: 'forged' },
      }),
    ).toMatchObject(platformToken)
    expect(findByIdMock).not.toHaveBeenCalled()
  })

  it('migrates legacy papel cookies and keeps version-zero sessions until revocation', async () => {
    findByIdMock.mockResolvedValueOnce({ ...currentUser, sessionVersion: 0 })
    const { role, sessionVersion, ...legacyToken } = currentToken
    void sessionVersion
    const migrated = await run({ ...legacyToken, papel: role } as unknown as typeof currentToken)
    expect(migrated.role).toBe('AGENT')
    expect(migrated.scope).toBe('tenant')
    expect(migrated).not.toHaveProperty('papel')
  })

  it('rejects unknown roles even if supplied by a legacy cookie', async () => {
    const { role, ...legacyToken } = currentToken
    void role
    expect(
      (await run({ ...legacyToken, papel: 'SUPERUSER' } as unknown as typeof currentToken)).scope,
    ).toBeUndefined()
  })
  it('accepts a validated rotated platform pair for the same admin', async () => {
    platformValidatePairMock.mockResolvedValueOnce({ sub: 'p1', scope: 'platform' })
    const platformToken = {
      sub: 'p1',
      scope: 'platform',
      accessToken: 'old',
      refreshToken: 'old-refresh',
    }
    expect(
      await run(platformToken as typeof currentToken, {
        trigger: 'update',
        session: { accessToken: 'new', refreshToken: 'new-refresh' },
      }),
    ).toMatchObject({ accessToken: 'new', refreshToken: 'new-refresh' })
    expect(platformValidatePairMock).toHaveBeenCalledWith('new', 'new-refresh')
  })

  it('rejects a platform pair belonging to a different administrator', async () => {
    platformValidatePairMock.mockResolvedValueOnce({ sub: 'p2', scope: 'platform' })
    const platformToken = {
      sub: 'p1',
      scope: 'platform',
      accessToken: 'old',
      refreshToken: 'old-refresh',
    }
    expect(
      await run(platformToken as typeof currentToken, {
        trigger: 'update',
        session: { accessToken: 'new', refreshToken: 'new-refresh' },
      }),
    ).toMatchObject(platformToken)
  })

  it('clears a deactivated platform session before accepting an update', async () => {
    platformFindByIdMock.mockResolvedValueOnce({ id: 'p1', active: false })
    const platformToken = {
      sub: 'p1',
      scope: 'platform',
      accessToken: 'old',
      refreshToken: 'old-refresh',
    }
    const result = await run(platformToken as typeof currentToken, {
      trigger: 'update',
      session: {},
    })
    expect(result).not.toHaveProperty('scope', expect.anything())
    expect(result).not.toHaveProperty('refreshToken', expect.anything())
  })
})
