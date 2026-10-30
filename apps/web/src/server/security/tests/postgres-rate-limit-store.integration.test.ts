import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { PostgresRateLimitStore } from '../postgres-rate-limit-store'
import { createRateLimitPolicy } from '../rate-limit'

describe('Postgres shared rate limit', () => {
  it('cleans 500 expired counters while preserving active counters', async () => {
    const prefix = `cleanup-${randomUUID()}:`
    const activeKey = `${prefix}active`
    try {
      await prisma.$executeRaw`
        INSERT INTO "auth_rate_limit_buckets" ("key", "count", "resetAt", "createdAt", "updatedAt")
        SELECT ${prefix} || i::text, 1, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '1 day',
          CURRENT_TIMESTAMP AT TIME ZONE 'UTC', CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
        FROM generate_series(1, 500) i
      `
      await new PostgresRateLimitStore().consume({
        key: activeKey,
        policy: createRateLimitPolicy('api', 10, 60_000),
      })
      await new PostgresRateLimitStore().cleanupExpired()
      const [remaining] = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT count(*) FROM "auth_rate_limit_buckets" WHERE "key" LIKE ${`${prefix}%`}
      `
      expect(Number(remaining.count)).toBe(0)
      const [active] = await prisma.$queryRaw<{ count: number }[]>`
        SELECT "count" FROM "auth_rate_limit_buckets" WHERE "key" = ${`api:${activeKey}`}
      `
      expect(active.count).toBe(1)
    } finally {
      await prisma.$executeRaw`DELETE FROM "auth_rate_limit_buckets" WHERE "key" LIKE ${`${prefix}%`} OR "key" = ${`api:${activeKey}`}`
    }
  })

  it.each(['auth', 'api', 'marketplace-inquiry'])(
    'shares an atomic capped %s counter across instances and resets expired windows',
    async (policyName) => {
      const key = `test-${randomUUID()}`
      const storedKey = `${policyName}:${key}`
      const stores = [
        new PostgresRateLimitStore(),
        new PostgresRateLimitStore(),
        new PostgresRateLimitStore(),
      ]
      const policy = createRateLimitPolicy(policyName, 10, 15 * 60_000)

      try {
        const results = await Promise.all(
          Array.from({ length: 30 }, (_, index) =>
            stores[index % stores.length].consume({ key, policy }),
          ),
        )
        expect(results.filter((result) => result.allowed)).toHaveLength(10)
        expect(results.filter((result) => !result.allowed)).toHaveLength(20)
        const [bucket] = await prisma.$queryRaw<{ count: number }[]>`
        SELECT "count" FROM "auth_rate_limit_buckets" WHERE "key" = ${storedKey}
      `
        expect(bucket.count).toBe(11)
        await prisma.$executeRaw`
        UPDATE "auth_rate_limit_buckets" SET "resetAt" = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '1 second'
        WHERE "key" = ${storedKey}
      `
        const nextWindow = await stores[1].consume({ key, policy })
        expect(nextWindow.allowed).toBe(true)
        expect(nextWindow.remaining).toBe(9)
        expect(nextWindow.retryAfter).toBe(900)
      } finally {
        await prisma.$executeRaw`DELETE FROM "auth_rate_limit_buckets" WHERE "key" = ${storedKey}`
      }
    },
  )
})
