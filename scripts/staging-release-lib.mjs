import { createHash, randomBytes } from 'node:crypto'

export function requireValue(condition, code) {
  if (!condition) throw new Error(code)
}

export function geocodingDeploymentArgs(env, target) {
  const endpoint = env.GEOCODING_SEARCH_URL || target.geocoding?.searchUrl
  if (!endpoint) return []
  let url
  try {
    url = new URL(endpoint)
  } catch {
    throw new Error('INVALID_GEOCODING_CONFIGURATION')
  }
  const userAgent = env.GEOCODING_USER_AGENT || target.geocoding?.userAgent
  requireValue(
    url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      typeof userAgent === 'string' &&
      userAgent.length > 0 &&
      !/[\r\n]/.test(userAgent),
    'INVALID_GEOCODING_CONFIGURATION',
  )
  return ['GEOCODING_SEARCH_URL=' + url.href, 'GEOCODING_USER_AGENT=' + userAgent].flatMap(
    (value) => ['--env', value, '--build-env', value],
  )
}

export function validateConfig(env, target) {
  requireValue(env.GITHUB_REPOSITORY === 'done-Think/ketris', 'WRONG_REPOSITORY')
  requireValue(env.GITHUB_REF === 'refs/heads/dev', 'WRONG_BRANCH')
  requireValue(/^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? ''), 'INVALID_RELEASE_SHA')
  for (const name of [
    'VERCEL_TOKEN',
    'VERCEL_ORG_ID',
    'VERCEL_PROJECT_ID',
    'CONTRACTS_DATA_ENCRYPTION_KEY',
  ]) {
    requireValue(Boolean(env[name]?.trim()), `MISSING_${name}`)
  }
  requireValue(
    Buffer.from(env.CONTRACTS_DATA_ENCRYPTION_KEY, 'base64').length === 32,
    'INVALID_CONTRACTS_KEY',
  )
  let url
  try {
    url = new URL(env.DATABASE_URL)
  } catch {
    throw new Error('INVALID_DATABASE_URL')
  }
  requireValue(
    ['postgres:', 'postgresql:'].includes(url.protocol) &&
      url.hostname === target.databaseHost &&
      url.pathname === `/${target.databaseName}` &&
      (!url.port || url.port === '5432') &&
      Boolean(url.password) &&
      (!url.searchParams.has('schema') || url.searchParams.get('schema') === 'public'),
    'WRONG_STAGING_DATABASE',
  )
  return url
}

export function createSmokeCredentials() {
  return {
    email: 'staging-smoke@ketris.example.test',
    password: randomBytes(32).toString('base64url'),
  }
}

export function findAutomationBypass(project, configured) {
  if (configured) return configured
  return Object.entries(project.protectionBypass ?? {}).find(
    ([, settings]) => settings?.scope === 'automation-bypass',
  )?.[0]
}

export function requiresAutomationBypass(project) {
  return [project.ssoProtection, project.passwordProtection, project.trustedIps].some(
    (settings) => settings && settings.deploymentType !== 'none',
  )
}

export function planMigrations(files, ledger, compatible) {
  requireValue(!ledger.some((row) => !row.finished_at && !row.rolled_back_at), 'FAILED_MIGRATION')
  const applied = ledger.filter((row) => row.finished_at && !row.rolled_back_at)
  const byName = new Map(files.map((file) => [file.name, file]))
  for (const row of applied) {
    const file = byName.get(row.migration_name)
    requireValue(
      file && row.checksum === createHash('sha256').update(file.sql).digest('hex'),
      'MIGRATION_HISTORY_MISMATCH',
    )
  }
  const names = new Set(applied.map((row) => row.migration_name))
  const pending = files.filter((file) => !names.has(file.name))
  for (const file of pending) {
    requireValue(
      typeof compatible[file.name] === 'string' && compatible[file.name].trim().length >= 20,
      `MIGRATION_COMPATIBILITY_NOT_DECLARED:${file.name}`,
    )
    // Conservative tripwire, not a SQL parser or a proof of compatibility. The author must
    // also review old readers/writers and declare the expand strategy in infra/deploy/staging.json.
    const sql = file.sql.toString().replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, '')
    requireValue(
      !/\b(DROP|TRUNCATE|RENAME)\b|\bDELETE\s+FROM\b|\bALTER\s+COLUMN\b|\bSET\s+NOT\s+NULL\b/i.test(
        sql,
      ),
      `MIGRATION_REQUIRES_MAINTENANCE:${file.name}`,
    )
    for (const statement of sql.split(';')) {
      requireValue(
        !(
          /\bALTER\s+TABLE\b[\s\S]*\bADD\b[\s\S]*\bNOT\s+NULL\b/i.test(statement) &&
          !/\bDEFAULT\b/i.test(statement)
        ),
        `MIGRATION_REQUIRES_MAINTENANCE:${file.name}`,
      )
    }
  }
  return pending.map((file) => file.name)
}

export async function runRelease(actions) {
  await actions.preflight()
  const pending = await actions.plan()
  const candidate = await actions.prepare()
  await actions.checkCurrentHead()
  if (pending.length) await actions.migrate()
  await actions.verifyDatabase()
  await actions.smoke(candidate)
  // Do not rebuild, reset the database, or auto-revert an already completed migration here.
  await actions.promote(candidate)
  await actions.smokePublic()
  return { candidate, pending }
}

export function validateCandidate(value, projectName) {
  let url
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error('INVALID_CANDIDATE_URL')
  }
  requireValue(
    url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      url.hostname.startsWith(`${projectName}-`) &&
      url.hostname.endsWith('.vercel.app') &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash,
    'INVALID_CANDIDATE_URL',
  )
  return url.origin
}

export async function smokeDeployment(
  { origin, canonicalOrigin = origin, sha, email, password, userId, bypass },
  fetcher = fetch,
) {
  const cookies = new Map()
  async function request(path, { method = 'GET', body, form = false } = {}) {
    const headers = {
      'X-Ketris-Api-Version': '3',
      Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
    }
    if (bypass) headers['x-vercel-protection-bypass'] = bypass
    if (body)
      headers['Content-Type'] = form ? 'application/x-www-form-urlencoded' : 'application/json'
    const response = await fetcher(new URL(path, origin), {
      method,
      headers,
      body: body ? (form ? new URLSearchParams(body).toString() : JSON.stringify(body)) : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(20_000),
    })
    requireValue(response.ok, `SMOKE_HTTP_FAILED:${path}:${response.status}`)
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.slice(0, cookie.indexOf(';') < 0 ? cookie.length : cookie.indexOf(';'))
      const split = pair.indexOf('=')
      if (split > 0) cookies.set(pair.slice(0, split), pair.slice(split + 1))
    }
    return response
  }
  let refreshToken
  try {
    const stats = await request('/api/marketplace/stats')
    const expectedDeployment = stats.headers.get('X-Ketris-Release-Sha') === sha
    if (!expectedDeployment) await stats.body?.cancel()
    requireValue(expectedDeployment, 'WRONG_DEPLOYMENT_SHA')
    requireValue(stats.headers.get('X-Ketris-Api-Version') === '3', 'WRONG_API_VERSION')
    requireValue(typeof (await stats.json()) === 'object', 'INVALID_STATS_RESPONSE')
    const { csrfToken } = await (await request('/api/auth/csrf')).json()
    requireValue(typeof csrfToken === 'string' && Boolean(csrfToken), 'MISSING_CSRF_TOKEN')
    const login = await (
      await request('/api/auth/callback/credentials', {
        method: 'POST',
        form: true,
        body: {
          csrfToken,
          email,
          password,
          callbackUrl: `${origin}/pt`,
          json: 'true',
        },
      })
    ).json()
    let callback
    try {
      callback = new URL(login.url)
    } catch {
      throw new Error('INVALID_LOGIN_RESPONSE')
    }
    requireValue(
      [origin, canonicalOrigin].includes(callback.origin) && !callback.searchParams.has('error'),
      'LOGIN_FAILED',
    )
    const session = await (await request('/api/auth/session')).json()
    refreshToken = session.refreshToken
    requireValue(
      session.user?.id === userId &&
        session.user?.email?.toLowerCase() === email.toLowerCase() &&
        session.scope === 'tenant' &&
        !session.authUnavailable &&
        Boolean(session.accessToken),
      'AUTHENTICATED_SESSION_FAILED',
    )
  } finally {
    // Revoke only the token created by this smoke; never log cookies, passwords or bodies.
    if (typeof refreshToken === 'string') {
      await request('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      })
    }
  }
}

export async function smokePublicDeployment(
  options,
  fetcher = fetch,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await smokeDeployment(options, fetcher)
    } catch (error) {
      // This error is raised by the initial GET, before any authentication request.
      if (error.message !== 'WRONG_DEPLOYMENT_SHA' || attempt === 19) throw error
      await wait(1500)
    }
  }
}
