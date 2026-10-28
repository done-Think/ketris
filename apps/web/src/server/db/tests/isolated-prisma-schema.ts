import { randomUUID } from 'node:crypto'

import { Prisma, PrismaClient } from '@prisma/client'

import { prisma } from '../prisma'
import { createPostgresAdapter } from '../postgres-adapter'

export async function isolatedPrismaSchema(tables: string[]) {
  if (tables.some((table) => !/^[a-z][a-z0-9_]*$/.test(table))) {
    throw new Error('Test table names must be fixed SQL identifiers.')
  }
  const schema = `fixture_${randomUUID().replaceAll('-', '')}`
  await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`)
  const database = new PrismaClient({
    adapter: createPostgresAdapter(
      { connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema},public` },
      { schema },
    ),
  })

  try {
    const enumTypes = await prisma.$queryRaw<{ name: string; values: string[] }[]>`
      SELECT DISTINCT t.typname::text AS name, ARRAY(SELECT enumlabel::text FROM pg_enum WHERE enumtypid = t.oid ORDER BY enumsortorder) AS values
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_type t ON t.oid = a.atttypid
      WHERE n.nspname = 'public' AND c.relname IN (${Prisma.join(tables)}) AND t.typtype = 'e'
    `
    for (const { name, values } of enumTypes) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error('Unexpected enum identifier.')
      const labels = values.map((value) => "'" + value.replaceAll("'", "''") + "'").join(', ')
      await prisma.$executeRawUnsafe(`CREATE TYPE "${schema}"."${name}" AS ENUM (${labels})`)
    }
    for (const table of tables) {
      await prisma.$executeRawUnsafe(
        `CREATE TABLE "${schema}"."${table}" (LIKE public."${table}" INCLUDING ALL)`,
      )
      const columns = await prisma.$queryRaw<
        { column: string; type: string; default: string | null }[]
      >`
        SELECT a.attname::text AS column, t.typname::text AS type, pg_get_expr(d.adbin, d.adrelid) AS default
        FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_type t ON t.oid = a.atttypid
        LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
        WHERE n.nspname = 'public' AND c.relname = ${table} AND t.typtype = 'e'
      `
      for (const column of columns) {
        if (
          !/^[A-Za-z_][A-Za-z0-9_]*$/.test(column.column) ||
          !/^[A-Za-z_][A-Za-z0-9_]*$/.test(column.type)
        )
          throw new Error('Unexpected fixture identifier.')
        const target = `"${schema}"."${table}"`
        const field = `"${column.column}"`
        const type = `"${schema}"."${column.type}"`
        await prisma.$executeRawUnsafe(`ALTER TABLE ${target} ALTER COLUMN ${field} DROP DEFAULT`)
        await prisma.$executeRawUnsafe(
          `ALTER TABLE ${target} ALTER COLUMN ${field} TYPE ${type} USING ${field}::text::${type}`,
        )
        if (column.default) {
          const value = column.default.replace(`::"${column.type}"`, `::${type}`)
          await prisma.$executeRawUnsafe(
            `ALTER TABLE ${target} ALTER COLUMN ${field} SET DEFAULT ${value}`,
          )
        }
      }
    }
  } catch (error) {
    await database.$disconnect()
    await prisma.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`)
    throw error
  }

  return {
    database,
    async dispose() {
      await database.$disconnect()
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      await prisma.$disconnect()
    },
  }
}
