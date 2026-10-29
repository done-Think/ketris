import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, readdir } from 'node:fs/promises'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { ensureSmokeAccount } from '../staging-smoke-account.mjs'
import { createSmokeCredentials, planMigrations } from '../staging-release-lib.mjs'

test('real schema: validates checksums and bootstraps only its reserved smoke account', async () => {
  const source = new URL(process.env.DATABASE_URL)
  assert.ok(
    ['localhost', '127.0.0.1'].includes(source.hostname),
    'Tests require a local disposable PostgreSQL server',
  )
  const name = `ketris_release_test_${randomBytes(6).toString('hex')}`
  source.pathname = '/postgres'
  const admin = new pg.Client({ connectionString: source.href })
  let client
  let created = false
  await admin.connect()
  try {
    await admin.query(`CREATE DATABASE "${name}"`)
    created = true
    source.pathname = `/${name}`
    try {
      await promisify(execFile)(
        process.execPath,
        ['../../node_modules/prisma/build/index.js', 'migrate', 'deploy'],
        {
          cwd: 'apps/web',
          env: { ...process.env, DATABASE_URL: source.href },
        },
      )
    } catch {
      throw new Error('DISPOSABLE_SCHEMA_SETUP_FAILED')
    }
    client = new pg.Client({ connectionString: source.href })
    await client.connect()
    const files = await Promise.all(
      (await readdir('apps/web/prisma/migrations', { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => ({
          name: entry.name,
          sql: await readFile(`apps/web/prisma/migrations/${entry.name}/migration.sql`),
        })),
    )
    const ledger = (
      await client.query(
        'SELECT migration_name, checksum, finished_at, rolled_back_at FROM public._prisma_migrations',
      )
    ).rows
    assert.deepEqual(planMigrations(files, ledger, {}), [])
    const credentials = createSmokeCredentials()
    const id = await ensureSmokeAccount(client, credentials)
    await ensureSmokeAccount(client, credentials)
    const [user] = (await client.query('SELECT * FROM public.users WHERE id=$1', [id])).rows
    assert.equal(user.role, 'AGENT')
    assert.equal(user.sessionVersion, 1)
    assert.equal(await bcrypt.compare(credentials.password, user.passwordHash), true)
    assert.equal(
      (await client.query('SELECT count(*)::int AS count FROM public.users')).rows[0].count,
      1,
    )
    await client.query(`INSERT INTO public.tenants (id, name, slug, "updatedAt")
      VALUES ('other-tenant', 'Other', 'other-tenant', NOW())`)
    await client.query(
      `INSERT INTO public.users (id, "tenantId", name, email, "passwordHash", "updatedAt")
      VALUES ('other-user', 'other-tenant', 'Other', $1, 'untouched-hash', NOW())`,
      [credentials.email],
    )
    await assert.rejects(ensureSmokeAccount(client, credentials), /SMOKE_USER_CONFLICT/)
    assert.equal(
      (await client.query('SELECT "passwordHash" FROM public.users WHERE id=$1', ['other-user']))
        .rows[0].passwordHash,
      'untouched-hash',
    )
    assert.equal(
      (await client.query('SELECT "sessionVersion" FROM public.users WHERE id=$1', [id])).rows[0]
        .sessionVersion,
      1,
    )
    await client.query('DELETE FROM public.tenants WHERE id=$1', [user.tenantId])
    await client.query("UPDATE public.tenants SET slug='staging-ci-smoke' WHERE id='other-tenant'")
    await assert.rejects(ensureSmokeAccount(client, credentials), /SMOKE_TENANT_CONFLICT/)
    assert.equal(
      (await client.query('SELECT count(*)::int AS count FROM public.users')).rows[0].count,
      1,
    )
  } finally {
    if (client) await client.end()
    if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await admin.end()
  }
})
