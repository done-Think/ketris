import { randomUUID } from 'node:crypto'

import { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { createPostgresAdapter } from '@server/db/postgres-adapter'
import { ForbiddenError } from '@server/shared/errors'

import { CannotDeactivateSelfError, LastPlatformAdminError } from '../../domain/errors'
import { PrismaPlatformAdminRepository } from '../../infrastructure/prisma-platform-admin.repository'

describe('platform administrator invariant under concurrent mutations', () => {
  const schema = `admin_policy_${randomUUID().replaceAll('-', '')}`
  const database = new PrismaClient({
    adapter: createPostgresAdapter(
      { connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema},public` },
      { schema },
    ),
  })
  const repository = new PrismaPlatformAdminRepository(database)
  let firstId: string
  let secondId: string

  beforeAll(async () => {
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`)
    await prisma.$executeRawUnsafe(
      `CREATE TABLE "${schema}".platform_admins (LIKE public.platform_admins INCLUDING ALL)`,
    )
    await prisma.$executeRawUnsafe(
      `CREATE TYPE "${schema}"."PlatformAdminRole" AS ENUM ('ADMIN', 'ADMIN_AGENT', 'AGENT')`,
    )
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${schema}".platform_admins ALTER COLUMN role DROP DEFAULT`,
    )
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${schema}".platform_admins ALTER COLUMN role TYPE "${schema}"."PlatformAdminRole" USING role::text::"${schema}"."PlatformAdminRole"`,
    )
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${schema}".platform_admins ALTER COLUMN role SET DEFAULT 'ADMIN'::"${schema}"."PlatformAdminRole"`,
    )
    await prisma.$executeRawUnsafe(
      `CREATE TABLE "${schema}".platform_admin_refresh_tokens (LIKE public.platform_admin_refresh_tokens INCLUDING ALL)`,
    )
  })

  beforeEach(async () => {
    await database.platformAdminRefreshToken.deleteMany()
    await database.platformAdmin.deleteMany()
    const first = await database.platformAdmin.create({
      data: { name: 'First manager', email: 'first@example.test', passwordHash: 'unused' },
    })
    const second = await database.platformAdmin.create({
      data: { name: 'Second manager', email: 'second@example.test', passwordHash: 'unused' },
    })
    firstId = first.id
    secondId = second.id
  })

  afterAll(async () => {
    await database.$disconnect()
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    await prisma.$disconnect()
  })

  it('allows exactly one of two concurrent self-demotions', async () => {
    const outcomes = await Promise.allSettled([
      repository.update(firstId, { role: 'AGENT' }, firstId),
      repository.update(secondId, { role: 'AGENT' }, secondId),
    ])
    expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    const rejected = outcomes.find((result) => result.status === 'rejected')
    expect(rejected).toMatchObject({ reason: expect.any(LastPlatformAdminError) })
    expect(await database.platformAdmin.count({ where: { active: true, role: 'ADMIN' } })).toBe(1)
  })

  it('revalidates an actor whose role changed after the HTTP authorization check', async () => {
    await repository.update(secondId, { role: 'ADMIN_AGENT' }, firstId)
    await expect(
      repository.update(firstId, { name: 'Unauthorized edit' }, secondId),
    ).rejects.toThrow(ForbiddenError)
    await expect(
      repository.create(
        {
          name: 'Unauthorized manager',
          email: 'third@example.test',
          role: 'ADMIN',
          passwordHash: 'unused',
        },
        secondId,
      ),
    ).rejects.toThrow(ForbiddenError)
    expect((await database.platformAdmin.findUniqueOrThrow({ where: { id: firstId } })).name).toBe(
      'First manager',
    )
  })

  it('does not allow two administrators to deactivate each other concurrently', async () => {
    const outcomes = await Promise.allSettled([
      repository.deactivate(secondId, firstId),
      repository.deactivate(firstId, secondId),
    ])
    expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(outcomes.filter((result) => result.status === 'rejected')).toHaveLength(1)
    expect(await database.platformAdmin.count({ where: { active: true, role: 'ADMIN' } })).toBe(1)
  })

  it('preserves the self-deactivation ban and atomically revokes another admin refresh tokens', async () => {
    await expect(repository.deactivate(firstId, firstId)).rejects.toThrow(CannotDeactivateSelfError)
    await database.platformAdminRefreshToken.create({
      data: {
        platformAdminId: secondId,
        tokenHash: randomUUID(),
        expiresAt: new Date(Date.now() + 60_000),
      },
    })
    await repository.deactivate(secondId, firstId)
    expect(
      await database.platformAdminRefreshToken.count({
        where: { platformAdminId: secondId, revokedAt: null },
      }),
    ).toBe(0)
    expect(await database.platformAdmin.count({ where: { active: true, role: 'ADMIN' } })).toBe(1)
  })
})
