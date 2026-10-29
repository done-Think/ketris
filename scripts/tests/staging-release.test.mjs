import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  createSmokeCredentials,
  findAutomationBypass,
  requiresAutomationBypass,
  planMigrations,
  runRelease,
  smokeDeployment,
  validateCandidate,
  validateConfig,
} from '../staging-release-lib.mjs'

const smokeCredentials = { email: 'smoke@example.test', password: 'private-password-long-enough' }
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
            'X-Ketris-Api-Version': '2',
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
