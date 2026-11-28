import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AccountDeactivatedError, InvalidCredentialsError } from '@server/auth/domain/errors'
import { InvalidPlatformCredentialsError } from '@server/platform/domain/errors'
import { UnauthorizedError } from '@server/shared/errors'

const executeMock = vi.fn()
const platformExecuteMock = vi.fn()
const platformFindByIdMock = vi.fn()
const refreshExecuteMock = vi.fn()
const platformRefreshExecuteMock = vi.fn()
const findByIdMock = vi.fn()
const verifyTokenMock = vi.fn()
const reportMock = vi.fn()

vi.mock('@server/auth/container', () => ({
  authContainer: {
    loginUseCase: { execute: executeMock },
    userRepository: { findById: findByIdMock },
    tokenService: { verify: verifyTokenMock },
    validateSessionTokensUseCase: { execute: verifyTokenMock },
    refreshAccessTokenUseCase: { execute: refreshExecuteMock },
  },
}))

vi.mock('@server/shared/observability/sentry-failure-reporter', () => ({
  failureReporter: { report: reportMock },
}))

vi.mock('@server/platform/container', () => ({
  platformContainer: {
    loginPlatformAdminUseCase: { execute: platformExecuteMock },
    platformAdminRepository: { findById: platformFindByIdMock },
    refreshPlatformAdminTokenUseCase: { execute: platformRefreshExecuteMock },
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
  })

  async function run(token = currentToken, extra: Record<string, unknown> = {}) {
    const jwt = await getJwtCallback()
    return jwt({ token: { ...token }, ...extra } as unknown as Parameters<typeof jwt>[0])
  }

  it('copies trusted provider claims on initial sign-in', async () => {
    findByIdMock.mockResolvedValueOnce({ ...currentUser, tenantAccountType: 'AGENCY' })
    const token = await run(currentToken, { user: { ...currentToken, sessionVersion: 3 } })
    expect(token).toMatchObject({ role: 'AGENT', sessionVersion: 3, accountType: 'AGENCY' })
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

  it('reports a non-authentication failure that makes authentication unavailable, with its cause', async () => {
    const outage = Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:5432'), {
      code: 'ECONNREFUSED',
    })
    findByIdMock.mockRejectedValueOnce(outage)
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await run()

    expect(reportMock).toHaveBeenCalledWith({
      module: 'auth',
      operation: 'session_validation',
      error: outage,
    })
    expect(log).toHaveBeenCalledWith('[auth] Session validation unavailable.', {
      name: 'Error',
      code: 'ECONNREFUSED',
    })
    expect(JSON.stringify(log.mock.calls)).not.toContain('10.0.0.1')
  })

  it('does not report expected authentication failures such as a revoked session', async () => {
    findByIdMock.mockResolvedValueOnce({ ...currentUser, sessionVersion: 3 })
    await run()
    findByIdMock.mockRejectedValueOnce(new UnauthorizedError())
    await run()
    expect(reportMock).not.toHaveBeenCalled()
  })

  it('reports a non-authentication failure while rotating tokens but keeps the session', async () => {
    const outage = new Error('database unavailable')
    refreshExecuteMock.mockRejectedValueOnce(outage)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await run(currentToken, { trigger: 'update', session: { refresh: true } })

    expect(reportMock).toHaveBeenCalledWith({
      module: 'auth',
      operation: 'session_refresh',
      error: outage,
    })
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
      },
    } as unknown as Parameters<typeof callback>[0])
    expect(result).toMatchObject({ authUnavailable: true, user: { id: 'u1' } })
    expect(result).not.toHaveProperty('accessToken', expect.anything())
    expect(result).not.toHaveProperty('refreshToken', expect.anything())
    expect(result).not.toHaveProperty('scope', expect.anything())
    expect(result).not.toHaveProperty('tenantId', expect.anything())
    expect(result).not.toHaveProperty('role', expect.anything())
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

  it('clears legacy-only role sessions so they require a new login', async () => {
    findByIdMock.mockResolvedValueOnce({ ...currentUser, sessionVersion: 0 })
    const { role, sessionVersion, ...legacyToken } = currentToken
    void sessionVersion
    const cleared = await run({ ...legacyToken, papel: role } as unknown as typeof currentToken)
    expect(cleared.scope).toBeUndefined()
    expect(cleared.role).toBeUndefined()
    expect(cleared.accessToken).toBeUndefined()
    expect(cleared.refreshToken).toBeUndefined()
    expect(cleared.authUnavailable).toBeUndefined()
  })

  it('keeps canonical role cookies without a session version when the stored version is zero', async () => {
    findByIdMock.mockResolvedValueOnce({ ...currentUser, sessionVersion: 0 })
    const { sessionVersion, ...canonicalToken } = currentToken
    void sessionVersion
    const token = await run(canonicalToken as typeof currentToken)
    expect(token.scope).toBe('tenant')
    expect(token.role).toBe('AGENT')
    expect(token.accessToken).toBe(currentToken.accessToken)
    expect(token.authUnavailable).toBeUndefined()
  })

  it('rejects unknown roles even if supplied by a legacy cookie', async () => {
    const { role, ...legacyToken } = currentToken
    void role
    expect(
      (await run({ ...legacyToken, papel: 'SUPERUSER' } as unknown as typeof currentToken)).scope,
    ).toBeUndefined()
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

  describe('server-side refresh', () => {
    const refreshRequest = { trigger: 'update', session: { refresh: true } }

    it('rotates the tenant tokens inside the encrypted token without trusting the client', async () => {
      refreshExecuteMock.mockResolvedValueOnce({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      })
      const token = await run(currentToken, {
        trigger: 'update',
        session: { refresh: true, accessToken: 'forged', refreshToken: 'forged-refresh' },
      })
      expect(refreshExecuteMock).toHaveBeenCalledWith({ refreshToken: 'stale-refresh' })
      expect(token).toMatchObject({ accessToken: 'new-access', refreshToken: 'new-refresh' })
    })

    it('ignores client-supplied tokens when no refresh is requested', async () => {
      const token = await run(currentToken, {
        trigger: 'update',
        session: { accessToken: 'forged', refreshToken: 'forged-refresh' },
      })
      expect(refreshExecuteMock).not.toHaveBeenCalled()
      expect(token).toMatchObject(currentToken)
    })

    it('does not refresh a session that lost access', async () => {
      findByIdMock.mockResolvedValueOnce({ ...currentUser, sessionVersion: 3 })
      const token = await run(currentToken, refreshRequest)
      expect(refreshExecuteMock).not.toHaveBeenCalled()
      expect(token.scope).toBeUndefined()
    })

    it('clears the session when the refresh token was rejected', async () => {
      refreshExecuteMock.mockRejectedValueOnce(new UnauthorizedError())
      const token = await run(currentToken, refreshRequest)
      expect(token.accessToken).toBeUndefined()
      expect(token.refreshToken).toBeUndefined()
      expect(token.scope).toBeUndefined()
    })

    it('keeps the session and tokens on a temporary refresh failure', async () => {
      refreshExecuteMock.mockRejectedValueOnce(new Error('database unavailable'))
      const token = await run(currentToken, refreshRequest)
      expect(token).toMatchObject(currentToken)
      expect(token.authUnavailable).toBeUndefined()
    })

    it('rotates platform tokens through the platform use case', async () => {
      platformRefreshExecuteMock.mockResolvedValueOnce({
        accessToken: 'platform-new',
        refreshToken: 'platform-new-refresh',
      })
      const platformToken = {
        sub: 'p1',
        scope: 'platform',
        accessToken: 'old',
        refreshToken: 'old-refresh',
      }
      const token = await run(platformToken as typeof currentToken, refreshRequest)
      expect(platformRefreshExecuteMock).toHaveBeenCalledWith({ refreshToken: 'old-refresh' })
      expect(refreshExecuteMock).not.toHaveBeenCalled()
      expect(token).toMatchObject({
        accessToken: 'platform-new',
        refreshToken: 'platform-new-refresh',
      })
    })

    it('never exposes the refresh token in the public session', async () => {
      const { authOptions } = await import('../auth-options')
      const callback = authOptions.callbacks!.session!
      const result = await callback({
        session: { user: { id: 'u1' }, expires: '2099-01-01' },
        token: currentToken,
      } as unknown as Parameters<typeof callback>[0])
      expect(result).toMatchObject({ accessToken: 'stale-access', scope: 'tenant' })
      expect(JSON.stringify(result)).not.toContain('stale-refresh')
      expect(result).not.toHaveProperty('refreshToken')
    })
  })
})
