import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import { command } from '../staging-release.mjs'
import {
  createSmokeCredentials,
  createReleaseDatabase,
  findAutomationBypass,
  geocodingDeploymentArgs,
  requiresAutomationBypass,
  planMigrations,
  runRelease,
  smokeDeployment,
  smokePublicDeployment,
  validateCandidate,
  validateConfig,
} from '../staging-release-lib.mjs'

const smokeCredentials = { email: 'smoke@example.test', password: 'private-password-long-enough' }

function databaseFixture() {
  const clients = []
  class Client extends EventEmitter {
    constructor(config) {
      super()
      this.config = config
      clients.push(this)
    }
    async connect() {
      this.connected = true
    }
    async query() {
      return { rows: [] }
    }
    async end() {
      this.connected = false
      this.ended = true
    }
  }
  return { clients, Client, withDatabase: createReleaseDatabase(Client, {}) }
}

test('closes database sessions before the remote build, schema command and promotion', async () => {
  const { clients, withDatabase } = databaseFixture()
  const { actions } = actionsFixture({ pending: [] })
  const assertClosed = () => assert.ok(clients.every((client) => client.ended))
  actions.plan = () =>
    withDatabase(async (client) => {
      await client.query()
      return []
    })
  actions.prepare = async () => {
    assertClosed()
    return 'https://candidate.example.test'
  }
  actions.verifyDatabase = async () => {
    await withDatabase((client) => client.query())
    assertClosed()
    // Prisma runs here without an idle pg session; the following transaction uses a fresh session.
    await withDatabase((client) => client.query())
  }
  actions.smoke = async () => assertClosed()
  actions.promote = async () => assertClosed()
  await runRelease(actions)
  assert.equal(new Set(clients).size, 3)
  assertClosed()
})

test('handles an asynchronous idle connection error as a release failure instead of crashing Node', async () => {
  const { clients, withDatabase } = databaseFixture()
  let finishOperation
  const result = withDatabase((client) => {
    queueMicrotask(() => client.emit('error', new Error('read ETIMEDOUT private-credentials')))
    return new Promise((resolve) => {
      finishOperation = resolve
    })
  })
  await assert.rejects(result, { message: 'STAGING_DATABASE_CONNECTION_FAILED' })
  assert.ok(clients[0].ended)
  finishOperation('late result')
})

test('closes failed connections and does not leak provider diagnostics', async () => {
  const { Client, clients } = databaseFixture()
  Client.prototype.connect = async function () {
    throw new Error('private-password@database.example.test')
  }
  await assert.rejects(
    createReleaseDatabase(Client, {})(() => assert.fail('Must not query')),
    { message: 'STAGING_DATABASE_OPERATION_FAILED' },
  )
  assert.ok(clients[0].ended)
})

test('does not retry database mutations and preserves migration/smoke guard errors', async () => {
  for (const message of [
    'MIGRATION_CHECKSUM_MISMATCH',
    'MIGRATIONS_STILL_PENDING',
    'SMOKE_USER_CONFLICT',
    'Query read timeout',
    'private SQL diagnostics',
  ]) {
    const { clients, withDatabase } = databaseFixture()
    let attempts = 0
    await assert.rejects(
      withDatabase(async () => {
        attempts++
        throw new Error(message)
      }),
      {
        message:
          message === 'Query read timeout'
            ? 'STAGING_DATABASE_QUERY_TIMEOUT'
            : message === 'private SQL diagnostics'
              ? 'STAGING_DATABASE_OPERATION_FAILED'
              : message,
      },
    )
    assert.equal(attempts, 1)
    assert.equal(clients.length, 1)
    assert.ok(clients[0].ended)
  }
})

test('cleanup failure cannot hide the original database guard failure', async () => {
  const { Client } = databaseFixture()
  Client.prototype.end = async function () {
    throw new Error('private shutdown diagnostics')
  }
  await assert.rejects(
    createReleaseDatabase(
      Client,
      {},
    )(async () => {
      throw new Error('SMOKE_USER_CONFLICT')
    }),
    { message: 'SMOKE_USER_CONFLICT' },
  )
})

test('commands return only successful stdout and redact all failed diagnostics', async () => {
  assert.equal(
    await command(process.execPath, [
      '-e',
      'console.log("candidate"); console.error("private diagnostics")',
    ]),
    'candidate',
  )
  await assert.rejects(
    command(process.execPath, [
      '-e',
      'console.log("private-output"); console.error("private-error"); process.exit(2)',
    ]),
    { message: 'COMMAND_FAILED' },
  )
  await assert.rejects(command('/nonexistent-ketris-command', ['private-argument']), {
    message: 'COMMAND_UNAVAILABLE',
  })
})

test('stalled commands time out without letting a release proceed', async () => {
  const { actions, calls } = actionsFixture({ pending: [] })
  actions.verifyDatabase = () =>
    command(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeoutMs: 100 })
  await assert.rejects(runRelease(actions), { message: 'COMMAND_TIMEOUT' })
  assert.equal(calls.includes('promote'), false)
})

test('explicitly configures staging geocoding for build and runtime, with a console override', () => {
  const target = {
    geocoding: {
      searchUrl: 'https://nominatim.openstreetmap.org/search',
      userAgent: 'Ketris/1.0 (+https://github.com/done-Think/ketris)',
    },
  }
  assert.deepEqual(geocodingDeploymentArgs({}, target), [
    '--env',
    'GEOCODING_SEARCH_URL=https://nominatim.openstreetmap.org/search',
    '--build-env',
    'GEOCODING_SEARCH_URL=https://nominatim.openstreetmap.org/search',
    '--env',
    `GEOCODING_USER_AGENT=${target.geocoding.userAgent}`,
    '--build-env',
    `GEOCODING_USER_AGENT=${target.geocoding.userAgent}`,
  ])
  assert.ok(
    geocodingDeploymentArgs(
      { GEOCODING_SEARCH_URL: 'https://replacement.example/search' },
      target,
    ).includes('GEOCODING_SEARCH_URL=https://replacement.example/search'),
  )
  assert.deepEqual(geocodingDeploymentArgs({}, {}), [])
  for (const endpoint of [
    'invalid-private-value',
    'http://unsecured.example/search',
    'https://user:private-password@example.test/search',
  ]) {
    assert.throws(() => geocodingDeploymentArgs({ GEOCODING_SEARCH_URL: endpoint }, target), {
      message: 'INVALID_GEOCODING_CONFIGURATION',
    })
  }
})

test('every migration since the automatic release baseline has a reviewed expand declaration', () => {
  const target = JSON.parse(
    readFileSync(new URL('../../infra/deploy/staging.json', import.meta.url)),
  )
  const declared = Object.keys(target.compatibleMigrations).sort()
  assert.ok(declared.length > 0, 'The automatic release baseline must be declared.')
  const directory = new URL('../../apps/web/prisma/migrations/', import.meta.url)
  const files = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name >= declared[0])
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => ({
      name: entry.name,
      sql: readFileSync(new URL(`${entry.name}/migration.sql`, directory)),
    }))
  assert.deepEqual(
    planMigrations(files, [], target.compatibleMigrations),
    files.map((file) => file.name),
  )
})
const sha = 'a'.repeat(40)
const target = { databaseHost: 'staging.example.test', databaseName: 'ketris' }
const env = {
  GITHUB_REPOSITORY: 'done-Think/ketris',
  GITHUB_REF: 'refs/heads/dev',
  GITHUB_SHA: sha,
  VERCEL_TOKEN: 'private-token',
  VERCEL_ORG_ID: 'team_test',
  VERCEL_PROJECT_ID: 'prj_test',
  CONTRACTS_DATA_ENCRYPTION_KEY: Buffer.alloc(32).toString('base64'),
  DATABASE_URL: 'postgresql://user:password@staging.example.test/ketris?sslmode=require',
}

test('refuses wrong database/branch/repository and never echoes credentials', () => {
  assert.equal(validateConfig(env, target).hostname, target.databaseHost)
  for (const changes of [
    { DATABASE_URL: 'postgresql://user:secret@production.example.test/ketris' },
    { DATABASE_URL: env.DATABASE_URL + '&schema=other' },
    { DATABASE_URL: 'a-private-password-in-an-invalid-url' },
    { GITHUB_REF: 'refs/heads/main' },
    { GITHUB_REPOSITORY: 'other/repo' },
    { GITHUB_SHA: 'dev' },
    { VERCEL_TOKEN: '' },
  ])
    assert.throws(
      () => validateConfig({ ...env, ...changes }, target),
      (error) => !error.message.includes('secret') && !error.message.includes('private-password'),
    )
})

test('generates fresh smoke credentials without GitHub secrets', () => {
  const first = createSmokeCredentials()
  const second = createSmokeCredentials()
  assert.equal(first.email, 'staging-smoke@ketris.example.test')
  assert.equal(second.email, first.email)
  assert.ok(first.password.length >= 32)
  assert.match(first.password, /^[A-Za-z0-9_-]+$/)
  assert.notEqual(first.password, second.password)
})

test('reuses only automation bypasses and preserves an explicit override', () => {
  const project = {
    protectionBypass: {
      shared: { scope: 'shareable-link' },
      private: { scope: 'automation-bypass' },
    },
  }
  assert.equal(findAutomationBypass(project), 'private')
  assert.equal(findAutomationBypass(project, 'override'), 'override')
  assert.equal(findAutomationBypass({}), undefined)
  assert.equal(
    findAutomationBypass({ protectionBypass: { shared: { scope: 'shareable-link' } } }),
    undefined,
  )
})

test('creates automation access only when a protection method is configured', () => {
  assert.equal(requiresAutomationBypass({}), false)
  assert.equal(requiresAutomationBypass({ ssoProtection: { deploymentType: 'none' } }), false)
  for (const key of ['ssoProtection', 'passwordProtection', 'trustedIps']) {
    assert.equal(
      requiresAutomationBypass({
        [key]: { deploymentType: 'prod_deployment_urls_and_all_previews' },
      }),
      true,
    )
  }
})

const file = {
  name: '20261029000000_expand',
  sql: Buffer.from('ALTER TABLE users ADD COLUMN nickname TEXT;'),
}
const reason = 'Add nullable field; existing readers and writers remain compatible.'
const applied = {
  migration_name: file.name,
  checksum: createHash('sha256').update(file.sql).digest('hex'),
  finished_at: new Date(),
}

test('validates the ledger and requires a declared compatible migration', () => {
  assert.deepEqual(planMigrations([file], [applied], {}), [])
  assert.throws(() => planMigrations([file], [], {}), /COMPATIBILITY_NOT_DECLARED/)
  assert.deepEqual(planMigrations([file], [], { [file.name]: reason }), [file.name])
  assert.throws(
    () => planMigrations([file], [{ ...applied, checksum: 'changed' }], {}),
    /HISTORY_MISMATCH/,
  )
  assert.throws(() => planMigrations([], [applied], {}), /HISTORY_MISMATCH/)
  assert.throws(
    () => planMigrations([file], [{ migration_name: file.name }], {}),
    /FAILED_MIGRATION/,
  )
  assert.deepEqual(
    planMigrations([file], [{ migration_name: file.name, rolled_back_at: new Date() }], {
      [file.name]: reason,
    }),
    [file.name],
  )
})

test('blocks destructive SQL even when compatibility has been declared', () => {
  for (const sql of [
    'DROP TABLE users;',
    'ALTER TABLE users RENAME TO people;',
    'TRUNCATE users;',
    'DELETE FROM users;',
    'ALTER TABLE users ALTER COLUMN name TYPE INTEGER;',
    'ALTER TABLE users ALTER COLUMN name SET NOT NULL;',
    'ALTER TABLE users ADD COLUMN name TEXT NOT NULL;',
  ]) {
    assert.throws(
      () => planMigrations([{ ...file, sql }], [], { [file.name]: reason }),
      /REQUIRES_MAINTENANCE/,
    )
  }
  assert.deepEqual(
    planMigrations(
      [{ ...file, sql: "ALTER TABLE users ADD COLUMN nickname TEXT NOT NULL DEFAULT '';" }],
      [],
      { [file.name]: reason },
    ),
    [file.name],
  )
})

test('allows adding a new table with required fields and ON DELETE foreign-key policy', () => {
  const sql =
    'CREATE TABLE child (id TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE);'
  assert.deepEqual(planMigrations([{ ...file, sql }], [], { [file.name]: reason }), [file.name])
})

function actionsFixture({ pending = [file.name], failure } = {}) {
  const calls = []
  const actions = Object.fromEntries(
    [
      'preflight',
      'plan',
      'prepare',
      'checkCurrentHead',
      'migrate',
      'verifyDatabase',
      'smoke',
      'promote',
      'smokePublic',
    ].map((name) => [
      name,
      async () => {
        calls.push(name)
        if (failure === name) throw new Error('INJECTED_FAILURE')
        return name === 'plan'
          ? pending
          : name === 'prepare'
            ? 'https://candidate.vercel.app'
            : undefined
      },
    ]),
  )
  return { actions, calls }
}

test('prepares before migration and promotes only after database and login pass', async () => {
  const { actions, calls } = actionsFixture()
  await runRelease(actions)
  assert.deepEqual(calls, [
    'preflight',
    'plan',
    'prepare',
    'checkCurrentHead',
    'migrate',
    'verifyDatabase',
    'smoke',
    'promote',
    'smokePublic',
  ])
})

test('publishes with or without pending migrations', async () => {
  for (const pending of [[], [file.name]]) {
    const { actions, calls } = actionsFixture({ pending })
    await runRelease(actions)
    assert.equal(calls.includes('migrate'), pending.length > 0)
  }
})

for (const failure of [
  'preflight',
  'plan',
  'prepare',
  'checkCurrentHead',
  'migrate',
  'verifyDatabase',
  'smoke',
]) {
  test(`failure at ${failure} prevents promotion`, async () => {
    const { actions, calls } = actionsFixture({ failure })
    await assert.rejects(runRelease(actions), /INJECTED_FAILURE/)
    assert.equal(calls.includes('promote'), false)
    if (['preflight', 'plan', 'prepare', 'checkCurrentHead'].includes(failure)) {
      assert.equal(calls.includes('migrate'), false)
    }
  })
}

test('promotion/post-promotion failure fails the release without reverting/resetting data', async () => {
  for (const failure of ['promote', 'smokePublic']) {
    const { actions, calls } = actionsFixture({ failure })
    await assert.rejects(runRelease(actions), /INJECTED_FAILURE/)
    assert.equal(calls.filter((call) => call === 'migrate').length, 1)
    assert.equal(calls.includes('reset'), false)
    assert.equal(calls.includes('rollback'), false)
  }
})

test('candidate must be an immutable HTTPS URL for the expected project', () => {
  assert.equal(
    validateCandidate('https://ketris-web-x9bk-123-team.vercel.app\n', 'ketris-web-x9bk'),
    'https://ketris-web-x9bk-123-team.vercel.app',
  )
  for (const url of [
    'https://other-123-team.vercel.app',
    'http://ketris-web-x9bk-123.vercel.app',
    'https://ketris-web-x9bk-123.vercel.app.evil.test',
    'https://ketris-web-x9bk.vercel.app',
    'https://user:secret@ketris-web-x9bk-123.vercel.app',
  ]) {
    assert.throws(() => validateCandidate(url, 'ketris-web-x9bk'), /INVALID_CANDIDATE/)
  }
})

function smokeFixture({
  wrongSha = false,
  wrongVersion = false,
  missingUser = false,
  unavailable = false,
  redirect = false,
  callbackOrigin,
} = {}) {
  const origin = 'https://ketris-web-x9bk-123-team.vercel.app'
  const seen = []
  const fetcher = async (url, options) => {
    seen.push({ url, options })
    assert.equal(url.origin, origin)
    assert.equal(options.redirect, 'manual')
    assert.equal(options.headers['X-Ketris-Api-Version'], '3')
    if (redirect)
      return new Response(null, {
        status: 302,
        headers: { Location: 'https://evil.test' },
      })
    const path = url.pathname
    if (path === '/api/marketplace/stats')
      return Response.json(
        { properties: 1 },
        {
          headers: {
            'X-Ketris-Release-Sha': wrongSha ? 'b'.repeat(40) : sha,
            'X-Ketris-Api-Version': wrongVersion ? '2' : '3',
          },
        },
      )
    if (path === '/api/auth/csrf')
      return Response.json(
        { csrfToken: 'csrf' },
        {
          headers: {
            'Set-Cookie': 'csrf=private-cookie; Path=/; Secure; HttpOnly',
          },
        },
      )
    if (path === '/api/auth/callback/credentials') {
      assert.match(options.headers.Cookie, /csrf=private-cookie/)
      assert.equal(new URLSearchParams(options.body).get('password'), smokeCredentials.password)
      return Response.json(
        { url: `${callbackOrigin || origin}/pt` },
        {
          headers: {
            'Set-Cookie': 'session=private-session; Path=/; Secure; HttpOnly',
          },
        },
      )
    }
    if (path === '/api/auth/session')
      return Response.json(
        missingUser
          ? {}
          : {
              user: { id: 'smoke-id', email: smokeCredentials.email },
              scope: 'tenant',
              accessToken: 'private-access-token',
              refreshToken: 'private-refresh-token',
              authUnavailable: unavailable,
            },
      )
    if (path === '/api/auth/logout') return new Response(null, { status: 204 })
    throw new Error('UNEXPECTED_REQUEST')
  }
  return {
    seen,
    fetcher,
    config: {
      origin,
      sha,
      email: smokeCredentials.email,
      password: smokeCredentials.password,
      userId: 'smoke-id',
      bypass: 'private-bypass',
    },
  }
}

test('smoke validates a real authenticated session and revokes its refresh token', async () => {
  const { config, fetcher, seen } = smokeFixture()
  await smokeDeployment(config, fetcher)
  assert.equal(seen.at(-1).url.pathname, '/api/auth/logout')
  assert.equal(JSON.parse(seen.at(-1).options.body).refreshToken, 'private-refresh-token')
})

test('public smoke waits for the promoted SHA before authenticating exactly once', async () => {
  const current = smokeFixture()
  const stale = smokeFixture({ wrongSha: true })
  const delays = []
  let reads = 0
  await smokePublicDeployment(
    current.config,
    (url, options) =>
      url.pathname === '/api/marketplace/stats' && reads++ < 2
        ? stale.fetcher(url, options)
        : current.fetcher(url, options),
    async (ms) => {
      delays.push(ms)
    },
  )
  assert.equal(reads, 3)
  assert.deepEqual(delays, [1500, 1500])
  assert.ok(stale.seen.every(({ options }) => options.method === 'GET'))
  assert.equal(
    current.seen.filter(({ url }) => url.pathname === '/api/auth/callback/credentials').length,
    1,
  )
  assert.equal(current.seen.filter(({ url }) => url.pathname === '/api/auth/logout').length, 1)
})

test('public smoke stops after twenty stale reads without submitting credentials', async () => {
  const { config, fetcher, seen } = smokeFixture({ wrongSha: true })
  let delays = 0
  await assert.rejects(
    smokePublicDeployment(config, fetcher, async () => {
      delays++
    }),
    /WRONG_DEPLOYMENT_SHA/,
  )
  assert.equal(seen.length, 20)
  assert.equal(delays, 19)
  assert.ok(
    seen.every(
      ({ url, options }) => url.pathname === '/api/marketplace/stats' && options.method === 'GET',
    ),
  )
})

test('public smoke never repeats login after an authentication failure', async () => {
  const { config, fetcher, seen } = smokeFixture({ unavailable: true })
  let delays = 0
  await assert.rejects(
    smokePublicDeployment(config, fetcher, async () => {
      delays++
    }),
    /AUTHENTICATED_SESSION_FAILED/,
  )
  assert.equal(delays, 0)
  assert.equal(
    seen.filter(({ url }) => url.pathname === '/api/auth/callback/credentials').length,
    1,
  )
  assert.equal(seen.filter(({ url }) => url.pathname === '/api/auth/logout').length, 1)
})

test('public smoke does not retry redirects or a wrong API contract', async () => {
  for (const failure of [{ redirect: true }, { wrongVersion: true }]) {
    const { config, fetcher, seen } = smokeFixture(failure)
    let delays = 0
    await assert.rejects(
      smokePublicDeployment(config, fetcher, async () => {
        delays++
      }),
    )
    assert.equal(delays, 0)
    assert.equal(seen.length, 1)
  }
})

test('accepts the configured canonical callback without following it from the candidate', async () => {
  const { config, fetcher, seen } = smokeFixture({
    callbackOrigin: 'https://ketris-web-x9bk.vercel.app',
  })
  await smokeDeployment(
    { ...config, canonicalOrigin: 'https://ketris-web-x9bk.vercel.app' },
    fetcher,
  )
  assert.ok(seen.every((request) => request.url.origin === config.origin))
})

for (const failure of [
  { wrongSha: true },
  { wrongVersion: true },
  { missingUser: true },
  { unavailable: true },
  { redirect: true },
  { callbackOrigin: 'https://other.vercel.app' },
]) {
  test(`smoke rejects ${Object.keys(failure)[0]} without exposing a response body`, async () => {
    const { config, fetcher } = smokeFixture(failure)
    await assert.rejects(
      smokeDeployment(config, fetcher),
      (error) => !/private-|password|cookie/.test(error.message),
    )
  })
}
