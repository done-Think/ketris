import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'

// This rehearsal upgrades a disposable clone. The synthetic rehearsal separately
// proves English rename rollback/reapply against the frozen reference schemas.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const web = path.join(root, 'apps/web')
const suffix = randomBytes(8).toString('hex')
const name = `ketris_local_upgrade_${suffix}`
const dump = `/tmp/ketris-local-upgrade-${suffix}.dump`
const server = 'postgresql://ketris:ketris@127.0.0.1:55532/'
const admin = new Client({ connectionString: server + 'postgres' })
const client = new Client({ connectionString: server + name })
const map = JSON.parse(await readFile(path.join(root, 'scripts/english-rename-map.json'), 'utf8'))
const legacy = await readFile(path.join(web, 'prisma/english-rename/legacy-schema.prisma'), 'utf8')
const models = [...legacy.matchAll(/^model (\w+) \{\n(.*?)^\}/gms)].map(([, model, body]) => ({
  model,
  table: body.match(/@@map\("([^"]+)"\)/)[1],
  fields: Object.fromEntries(
    [...body.matchAll(/^\s+(\w+)\s+(\w+)(\[\])?/gm)].map(([, field, type, array]) => [
      field,
      { type, array: Boolean(array) },
    ]),
  ),
}))
const enums = new Set([...legacy.matchAll(/^enum (\w+) \{/gm)].map(([, name]) => name))
let temp,
  created = false,
  connected = false
function command(executable, args, options = {}) {
  const result = spawnSync(executable, args, { encoding: 'utf8', timeout: 180_000, ...options })
  if (result.error) throw result.error
  assert.equal(result.status, 0, `${result.stdout ?? ''}\n${result.stderr ?? ''}`)
  return result.stdout
}
async function snapshot() {
  const english = (
    await client.query(
      "SELECT EXISTS(SELECT 1 FROM _prisma_migrations WHERE migration_name = '20261101000000_rename_schema_to_english' AND finished_at IS NOT NULL AND rolled_back_at IS NULL) AS present",
    )
  ).rows[0].present
  const result = {}
  for (const { model, table, fields } of models) {
    const target = map.physical[table] ?? table
    const rows = (
      await client.query(
        `SELECT to_jsonb(record) AS value FROM "${english ? target : table}" AS record`,
      )
    ).rows.map(({ value }) => {
      if (english) return value
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => {
          const field = fields[key]
          if (field && enums.has(field.type) && item !== null)
            item = field.array
              ? item.map((entry) => map.physical[entry] ?? entry)
              : (map.physical[item] ?? item)
          return [map.byModel[model].fields[key] ?? key, item]
        }),
      )
    })
    result[target] = new Map(rows.map((row) => [row.id, row]))
  }
  return result
}
function mediaType(value) {
  const lower = value.toLowerCase()
  if (['video', 'vídeo'].includes(lower)) return 'VIDEO'
  if (['planta', 'floor_plan', 'floorplan'].includes(lower)) return 'FLOOR_PLAN'
  assert.ok(
    ['foto', 'photo', 'image', 'imagem'].includes(lower),
    'Unsupported historical media type',
  )
  return 'PHOTO'
}
function compare(before, after) {
  let count = 0
  for (const [table, oldRows] of Object.entries(before)) {
    const newRows = after[table]
    assert.equal(newRows.size, oldRows.size, `Row count changed in ${table}`)
    for (const [id, old] of oldRows) {
      const current = newRows.get(id)
      assert.ok(current, `Historical row missing in ${table}`)
      for (const [field, value] of Object.entries(old)) {
        let expected = value
        if (table === 'property_media' && field === 'type') expected = mediaType(value)
        if (
          ['contract_parties', 'contract_signatures'].includes(table) &&
          ['createdAt', 'updatedAt'].includes(field) &&
          value === null
        ) {
          const parent =
            table === 'contract_parties'
              ? before.contracts.get(old.contractId)
              : after.contract_parties.get(old.contractPartyId)
          expected =
            field === 'createdAt'
              ? (old.signedAt ?? parent.createdAt)
              : (old.signedAt ?? old.createdAt ?? parent.createdAt)
        }
        assert.deepEqual(current[field], expected, `Unexpected data change in ${table}.${field}`)
      }
      if (['property_addresses', 'property_media', 'contract_parties'].includes(table)) {
        const parent =
          table === 'contract_parties'
            ? after.contracts.get(current.contractId)
            : after.properties.get(current.propertyId)
        assert.equal(current.tenantId, parent.tenantId, `Tenant backfill mismatch in ${table}`)
      }
      if (table === 'agency_profile_highlights' && !('createdAt' in old)) {
        const parent = after.agency_public_profiles.get(current.profileId)
        assert.equal(current.createdAt, parent.createdAt)
        assert.equal(current.updatedAt, parent.createdAt)
      }
      count++
    }
  }
  return count
}
try {
  await admin.connect()
  command('docker', [
    'exec',
    'ketris-db',
    'pg_dump',
    '-U',
    'ketris',
    '-d',
    'ketris',
    '-Fc',
    '--no-owner',
    '--no-acl',
    '-f',
    dump,
  ])
  await admin.query(`CREATE DATABASE "${name}"`)
  created = true
  command('docker', [
    'exec',
    'ketris-db',
    'pg_restore',
    '-U',
    'ketris',
    '--no-owner',
    '--no-acl',
    '-d',
    name,
    dump,
  ])
  await client.connect()
  connected = true
  const ledger = (
    await client.query(
      'SELECT id, migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY id',
    )
  ).rows
  const before = await snapshot()
  console.log(
    `Cloned local database with ${ledger.length} migration records; original remains unchanged.`,
  )
  temp = await mkdtemp(path.join(web, '.rename-local-rehearsal-'))
  await writeFile(
    path.join(temp, 'config.ts'),
    `import { defineConfig } from 'prisma/config'\nexport default defineConfig({ schema: ${JSON.stringify(path.join(web, 'prisma/schema.prisma'))}, migrations: { path: ${JSON.stringify(path.join(web, 'prisma/migrations'))} }, datasource: { url: process.env.RENAME_DATABASE_URL! } })`,
  )
  const prisma = (args) =>
    command(
      process.execPath,
      [
        path.join(root, 'node_modules/prisma/build/index.js'),
        ...args,
        '--config',
        path.join(temp, 'config.ts'),
      ],
      { cwd: web, env: { ...process.env, RENAME_DATABASE_URL: server + name } },
    )
  prisma(['migrate', 'deploy'])
  prisma([
    'migrate',
    'diff',
    '--from-config-datasource',
    '--to-schema',
    path.join(web, 'prisma/schema.prisma'),
    '--exit-code',
  ])
  const count = compare(before, await snapshot())
  const ids = ledger.map((row) => row.id)
  assert.deepEqual(
    (
      await client.query(
        'SELECT id, migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations WHERE id = ANY($1) ORDER BY id',
        [ids],
      )
    ).rows,
    ledger,
  )
  prisma(['migrate', 'deploy'])
  compare(before, await snapshot())
  const digest = createHash('sha256').update(JSON.stringify(ledger)).digest('hex')
  console.log(
    `PASS: active migration chain preserves ${count} rows across ${models.length} tables; declared enum/metadata backfills verified.`,
  )
  console.log(
    `PASS: repeated deploy succeeds; previous migration ledger preserved (SHA256 ${digest}). No business payloads printed.`,
  )
} finally {
  if (connected) await client.end()
  if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`)
  await admin.end()
  command('docker', ['exec', 'ketris-db', 'rm', '-f', dump])
  if (temp) await rm(temp, { recursive: true, force: true })
}
