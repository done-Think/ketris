import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Client } from 'pg'
import { expect, it } from 'vitest'

const migration = readFileSync(
  resolve('prisma/migrations/20261110090000_lead_property_reference/migration.sql'),
  'utf8',
)

async function rehearse(invalidReference: boolean) {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  const schema = 'lead_migration_' + randomBytes(8).toString('hex')
  await client.connect()
  try {
    await client.query(`CREATE SCHEMA "${schema}"`)
    await client.query(`SET search_path TO "${schema}"`)
    await client.query(`CREATE TABLE properties (id text, "tenantId" text, UNIQUE (id, "tenantId"));
      CREATE TABLE opportunities (id text, "tenantId" text, "propertyId" text);
      CREATE TABLE leads (id text, "tenantId" text, "opportunityId" text, interest text, notes text, "createdAt" timestamptz, "updatedAt" timestamptz)`)
    await client.query('INSERT INTO properties VALUES ($1,$2)', [
      'property',
      invalidReference ? 'foreign' : 'agency',
    ])
    await client.query('INSERT INTO opportunities VALUES ($1,$2,$3)', [
      'opportunity',
      'agency',
      'property',
    ])
    await client.query(
      `INSERT INTO leads VALUES ('converted','agency','opportunity','Original interest','Preserve notes','2025-01-01','2025-02-01'),('raw','agency',NULL,'Legacy free text',NULL,'2025-01-01','2025-02-01')`,
    )
    const before = (
      await client.query('SELECT id,interest,notes,"createdAt","updatedAt" FROM leads ORDER BY id')
    ).rows
    if (invalidReference) {
      await expect(client.query(migration)).rejects.toMatchObject({ code: '23503' })
      await client.query('ROLLBACK')
      expect(
        (
          await client.query(
            'SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND column_name=$2',
            [schema, 'propertyId'],
          )
        ).rows,
      ).toHaveLength(1)
      // Only opportunities had propertyId before the failed transaction.
      expect(
        (
          await client.query(
            'SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 AND column_name=$3',
            [schema, 'leads', 'propertyId'],
          )
        ).rows,
      ).toHaveLength(0)
    } else {
      await client.query(migration)
      expect((await client.query('SELECT id,"propertyId" FROM leads ORDER BY id')).rows).toEqual([
        { id: 'converted', propertyId: 'property' },
        { id: 'raw', propertyId: null },
      ])
      await expect(
        client.query(
          `INSERT INTO leads(id,"tenantId","propertyId") VALUES ('invalid','foreign','property')`,
        ),
      ).rejects.toMatchObject({ code: '23503' })
    }
    expect(
      (
        await client.query(
          'SELECT id,interest,notes,"createdAt","updatedAt" FROM leads ORDER BY id',
        )
      ).rows,
    ).toEqual(before)
  } finally {
    await client.query('ROLLBACK').catch(() => {})
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    await client.end()
  }
}

it('upgrades existing converted leads while preserving legacy text and dates', async () => {
  await rehearse(false)
})
it('rolls back the entire migration when a reference cannot satisfy tenant isolation', async () => {
  await rehearse(true)
})
