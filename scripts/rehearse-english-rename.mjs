import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Client } from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const web = path.join(root, 'apps/web')
const candidate = path.join(web, 'prisma/english-rename')
const prismaCli = path.join(root, 'node_modules/prisma/build/index.js')
const forwardName = '20261101000000_rename_schema_to_english'
const compensationName = '20261101001000_revert_english_rename'
const reapplyName = '20261101002000_reapply_english_rename'
const serverUrl = new URL(process.env.RENAME_REHEARSAL_SERVER_URL ?? 'http://invalid')

assert.ok(['postgres:', 'postgresql:'].includes(serverUrl.protocol), 'Configure a PostgreSQL URL.')
assert.ok(
  ['localhost', '127.0.0.1', '[::1]'].includes(serverUrl.hostname),
  'The rehearsal only accepts a loopback PostgreSQL server.',
)
assert.equal(serverUrl.pathname, '/postgres', 'Use the postgres administrative database.')
assert.equal(serverUrl.search, '', 'Connection overrides are not accepted by the rehearsal.')

const databaseNames = []
const connections = []
const admin = new Client({ connectionString: serverUrl.href })
let temp

function databaseUrl(name) {
  const url = new URL(serverUrl)
  url.pathname = `/${name}`
  return url.href
}

function redact(value) {
  const password = decodeURIComponent(serverUrl.password)
  return password ? value.replaceAll(password, '[redacted]') : value
}

function command(args, url, expectedFailure = false) {
  const result = spawnSync(
    process.execPath,
    [prismaCli, ...args, '--config', path.join(temp, 'config.ts')],
    {
      cwd: web,
      env: { ...process.env, RENAME_REHEARSAL_DATABASE_URL: url },
      encoding: 'utf8',
      timeout: 60_000,
    },
  )
  if (result.error) throw result.error
  const output = redact(`${result.stdout ?? ''}\n${result.stderr ?? ''}`)
  if (expectedFailure) {
    assert.notEqual(result.status, 0, 'The injected failure must stop migrate deploy.')
    // Prisma can report its failed attempt to log the error inside the aborted transaction.
    assert.match(output, /division by zero|current transaction is aborted/)
  } else {
    assert.equal(result.status, 0, output)
  }
  return output
}

async function createDatabase() {
  const name = `ketris_rename_rehearsal_${randomBytes(8).toString('hex')}`
  await admin.query(`CREATE DATABASE "${name}"`)
  databaseNames.push(name)
  const client = new Client({ connectionString: databaseUrl(name) })
  await client.connect()
  connections.push(client)
  return { client, url: databaseUrl(name) }
}

async function migration(name, sql) {
  const directory = path.join(temp, 'migrations', name)
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'migration.sql'), sql)
}

function assertCandidate(sql) {
  assert.match(sql, /^BEGIN;\s/)
  assert.match(sql, /\sCOMMIT;\s*$/)
  const statements = sql
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
  assert.equal(statements.length, 589)
  assert.ok(
    statements.slice(1, -1).every((part) => /^ALTER (TYPE|TABLE|INDEX) .+ RENAME /s.test(part)),
  )
}

function injectFailure(sql) {
  const result = sql.replace(/\nCOMMIT;\s*$/, '\nSELECT 1 / 0;\nCOMMIT;\n')
  assert.notEqual(result, sql)
  return result
}

async function catalog(client) {
  const result = await client.query(`
    SELECT 'column' AS kind, c.relname AS owner, a.attname AS name,
           format_type(a.atttypid, a.atttypmod) || ':' || a.attnotnull || ':' ||
           COALESCE(pg_get_expr(d.adbin, d.adrelid), '') AS definition
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname <> '_prisma_migrations'
      AND a.attnum > 0 AND NOT a.attisdropped
    UNION ALL
    SELECT 'constraint', c.relname, k.conname, pg_get_constraintdef(k.oid)
    FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname <> '_prisma_migrations'
    UNION ALL
    SELECT 'index', tablename, indexname, indexdef FROM pg_indexes
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
    UNION ALL
    SELECT 'enum', t.typname, e.enumlabel, e.enumsortorder::text
    FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public'
    ORDER BY kind, owner, name
  `)
  return result.rows
}

async function seed(client) {
  await client.query(`
    INSERT INTO tenants (id, nome, slug, "updatedAt") VALUES ('rename-tenant', 'Rehearsal', 'rename-rehearsal', now());
    INSERT INTO usuarios (id, "tenantId", nome, email, "senhaHash", papel, "updatedAt")
      VALUES ('rename-user', 'rename-tenant', 'Rehearsal', 'rename@example.test', 'unusable', 'OWNER', now());
    INSERT INTO imoveis (id, "tenantId", "responsavelId", titulo, finalidade, tipo, valor, "updatedAt")
      VALUES ('rename-property', 'rename-tenant', 'rename-user', 'Rehearsal', 'ALUGUEL', 'CASA', 100, now());
    INSERT INTO chamados_manutencao (id, "tenantId", "imovelId", categoria, titulo, descricao, "abertoPorNome", "updatedAt")
      VALUES ('rename-ticket', 'rename-tenant', 'rename-property', 'PLUMBING', 'Rehearsal', 'RESOLVIDO is free text', 'Rehearsal', now());
  `)
  const arrays = [
    ['descricao', 'tipo', 'valor', 'vencimento'],
    ['description', 'type', 'amount', 'dueDate'],
    ['descricao', 'description', 'unknown', 'valor', 'amount'],
    [],
  ]
  for (const [index, fields] of arrays.entries()) {
    await client.query(
      `
      INSERT INTO charge_audit_events (id, "tenantId", "chargeCode", action, "changedFields", snapshot, reason)
      VALUES ($1, 'rename-tenant', 'REHEARSAL', 'UPDATED', $2, $3::jsonb, 'description and RESOLVIDO remain free text')
    `,
      [
        `audit-${index}`,
        fields,
        JSON.stringify({ type: 'A_RECEBER', status: 'PENDENTE', description: 'RESOLVIDO' }),
      ],
    )
  }
  await client.query(`
    INSERT INTO atividades_chamado_manutencao (id, "chamadoId", tipo, mensagem, detalhes, "systemAction")
    VALUES ('activity-legacy', 'rename-ticket', 'MUDANCA_STATUS', 'RESOLVIDO remains free text',
      '{"before":"ABERTO","after":"RESOLVIDO","reason":"RESOLVIDO","unknown":{"status":"custom"}}', 'STATUS_CHANGED')
  `)
}

async function history(client, renamed) {
  const charges = await client.query(
    'SELECT id, "changedFields", snapshot, reason FROM charge_audit_events ORDER BY id',
  )
  const table = renamed ? 'maintenance_ticket_activities' : 'atividades_chamado_manutencao'
  const details = renamed ? 'details' : 'detalhes'
  const message = renamed ? 'message' : 'mensagem'
  const activities = await client.query(
    `SELECT id, "${details}" AS details, "${message}" AS message FROM "${table}" ORDER BY id`,
  )
  return { charges: charges.rows, activities: activities.rows }
}

try {
  const up = await readFile(path.join(candidate, 'migration.sql'), 'utf8')
  const down = await readFile(path.join(candidate, 'down.sql'), 'utf8')
  assert.equal(
    await readFile(path.join(web, 'prisma/migrations', forwardName, 'migration.sql'), 'utf8'),
    up,
  )
  assertCandidate(up)
  assertCandidate(down)
  for (const name of ['migration.sql', 'down.sql', 'schema.prisma']) {
    const checksum = createHash('sha256')
      .update(await readFile(path.join(candidate, name)))
      .digest('hex')
    console.log(`SHA256 ${name}: ${checksum}`)
  }
  temp = await mkdtemp(path.join(web, '.rename-rehearsal-'))
  await cp(path.join(web, 'prisma/migrations'), path.join(temp, 'migrations'), { recursive: true })
  const laterMigrations = (
    await readdir(path.join(web, 'prisma/migrations'), { withFileTypes: true })
  )
    .filter((entry) => entry.isDirectory() && entry.name > forwardName)
    .map((entry) => entry.name)
  for (const name of [forwardName, ...laterMigrations]) {
    await rm(path.join(temp, 'migrations', name), { recursive: true })
  }
  await writeFile(
    path.join(temp, 'config.ts'),
    `
    import { defineConfig } from 'prisma/config'
    export default defineConfig({
      schema: ${JSON.stringify(path.join(web, 'prisma/schema.prisma'))},
      migrations: { path: ${JSON.stringify(path.join(temp, 'migrations'))} },
      datasource: { url: process.env.RENAME_REHEARSAL_DATABASE_URL! },
    })
  `,
  )
  await admin.connect()
  const version = await admin.query('SHOW server_version')
  const prisma = JSON.parse(
    await readFile(path.join(root, 'node_modules/prisma/package.json'), 'utf8'),
  )
  console.log(`PostgreSQL ${version.rows[0].server_version}; Prisma ${prisma.version}`)
  const { client, url } = await createDatabase()
  command(['migrate', 'deploy'], url)
  await seed(client)
  const originalCatalog = await catalog(client)
  const originalHistory = await history(client, false)
  const failingSql = injectFailure(up)
  await assert.rejects(() => client.query(failingSql), { code: '22012' })
  await client.query('ROLLBACK')
  assert.deepEqual(await catalog(client), originalCatalog)
  assert.deepEqual(await history(client, false), originalHistory)
  await migration(forwardName, failingSql)
  command(['migrate', 'deploy'], url, true)
  assert.deepEqual(await catalog(client), originalCatalog)
  assert.deepEqual(await history(client, false), originalHistory)
  const failed = await client.query(
    'SELECT id FROM _prisma_migrations WHERE migration_name = $1 AND finished_at IS NULL AND rolled_back_at IS NULL',
    [forwardName],
  )
  assert.equal(failed.rowCount, 1)
  console.log('PASS: injected failure rolls back schema and preserves mixed historical data.')

  await migration(forwardName, up)
  command(['migrate', 'resolve', '--rolled-back', forwardName], url)
  command(['migrate', 'deploy'], url)
  command(
    [
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema',
      path.join(candidate, 'schema.prisma'),
      '--exit-code',
    ],
    url,
  )
  assert.deepEqual(await history(client, true), originalHistory)
  console.log(
    'PASS: repaired deployment matches the candidate schema without rewriting audit data.',
  )

  await client.query(`
    INSERT INTO charge_audit_events (id, "tenantId", "chargeCode", action, "changedFields", snapshot)
    VALUES ('audit-new', 'rename-tenant', 'REHEARSAL', 'UPDATED', ARRAY['description','amount'], '{"type":"RECEIVABLE","status":"PENDING"}');
    INSERT INTO maintenance_ticket_activities (id, "ticketId", type, message, details, "systemAction")
    VALUES ('activity-new', 'rename-ticket', 'STATUS_CHANGE', 'New audit', '{"before":"OPEN","after":"RESOLVED"}', 'STATUS_CHANGED');
  `)
  const historyWithNewWrites = await history(client, true)
  const renamedCatalog = await catalog(client)
  const failingDown = injectFailure(down)
  await assert.rejects(() => client.query(failingDown), { code: '22012' })
  await client.query('ROLLBACK')
  assert.deepEqual(await catalog(client), renamedCatalog)
  assert.deepEqual(await history(client, true), historyWithNewWrites)
  await migration(compensationName, failingDown)
  command(['migrate', 'deploy'], url, true)
  assert.deepEqual(await catalog(client), renamedCatalog)
  assert.deepEqual(await history(client, true), historyWithNewWrites)
  const failedCompensation = await client.query(
    'SELECT id FROM _prisma_migrations WHERE migration_name = $1 AND finished_at IS NULL AND rolled_back_at IS NULL',
    [compensationName],
  )
  assert.equal(failedCompensation.rowCount, 1)
  console.log('PASS: failed compensation preserves the English schema and all audit payloads.')
  await migration(compensationName, down)
  command(['migrate', 'resolve', '--rolled-back', compensationName], url)
  command(['migrate', 'deploy'], url)
  command(
    [
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema',
      path.join(candidate, 'legacy-schema.prisma'),
      '--exit-code',
    ],
    url,
  )
  assert.deepEqual(await catalog(client), originalCatalog)
  assert.deepEqual(await history(client, false), historyWithNewWrites)
  console.log(
    'PASS: compensation restores the old schema and retains legacy and new audit payloads.',
  )

  await migration(reapplyName, up)
  command(['migrate', 'deploy'], url)
  command(['migrate', 'status'], url)
  command(
    [
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema',
      path.join(candidate, 'schema.prisma'),
      '--exit-code',
    ],
    url,
  )
  assert.deepEqual(await history(client, true), historyWithNewWrites)
  console.log('PASS: next deployment succeeds after compensation with coherent Prisma history.')

  for (const name of laterMigrations) {
    await cp(path.join(web, 'prisma/migrations', name), path.join(temp, 'migrations', name), {
      recursive: true,
    })
  }
  command(['migrate', 'deploy'], url)
  command(
    [
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema',
      path.join(web, 'prisma/schema.prisma'),
      '--exit-code',
    ],
    url,
  )
  assert.deepEqual(await history(client, true), historyWithNewWrites)
  console.log('PASS: later migrations advance the recovered database to the active schema.')

  await rm(path.join(temp, 'migrations', compensationName), { recursive: true })
  await rm(path.join(temp, 'migrations', reapplyName), { recursive: true })
  const fresh = await createDatabase()
  command(['migrate', 'deploy'], fresh.url)
  command(
    [
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema',
      path.join(web, 'prisma/schema.prisma'),
      '--exit-code',
    ],
    fresh.url,
  )
  console.log('PASS: full migration chain creates the target schema from an empty database.')
} finally {
  await Promise.all(connections.map((client) => client.end()))
  for (const name of databaseNames) {
    await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`)
  }
  await admin.end()
  if (temp) await rm(temp, { recursive: true, force: true })
}
