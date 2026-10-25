import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { PostgresRateLimitStore } from '../postgres-rate-limit-store'
import { createRateLimitPolicy } from '../rate-limit'

describe('Postgres auth rate limit', () => {
  it('shares an atomic capped counter across instances, rejects excess concurrency and resets expired windows', async () => {
    const key = `test-${randomUUID()}`
    const storedKey = `auth:${key}`
    const stores = [
      new PostgresRateLimitStore(),
      new PostgresRateLimitStore(),
      new PostgresRateLimitStore(),
    ]
    const policy = createRateLimitPolicy('auth', 10, 15 * 60_000)

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
  })
})
