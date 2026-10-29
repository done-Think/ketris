import { prisma } from '@server/db/prisma'

import type {
  RateLimitDatabase,
  RateLimitInput,
  RateLimitResult,
  RateLimitStore,
  StoredRateLimitBucket,
} from './types/rate-limit.types'

export class PostgresRateLimitStore implements RateLimitStore {
  private nextCleanupAt = 0

  constructor(private readonly database: RateLimitDatabase = prisma) {}

  async consume(input: RateLimitInput): Promise<RateLimitResult> {
    const key = `${input.policy.name}:${input.key}`
    const { limit, windowMs } = input.policy
    const [bucket] = await this.database.$queryRaw<StoredRateLimitBucket[]>`
      INSERT INTO "auth_rate_limit_buckets" ("key", "count", "resetAt", "createdAt", "updatedAt")
      VALUES (
        ${key}, 1,
        date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + ${windowMs}::double precision * INTERVAL '1 millisecond',
        date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
      )
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "auth_rate_limit_buckets"."resetAt" <= date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') THEN 1
          ELSE LEAST("auth_rate_limit_buckets"."count" + 1, ${limit}::integer + 1)
        END,
        "resetAt" = CASE
          WHEN "auth_rate_limit_buckets"."resetAt" <= date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
            THEN date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + ${windowMs}::double precision * INTERVAL '1 millisecond'
          ELSE "auth_rate_limit_buckets"."resetAt"
        END,
        "updatedAt" = date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
      RETURNING "count", "resetAt", date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS "observedAt"
    `

    if (!bucket) throw new Error('Contador de requisições indisponível.')

    return {
      allowed: bucket.count <= limit,
      limit,
      remaining: Math.max(limit - bucket.count, 0),
      resetAt: bucket.resetAt.getTime(),
      retryAfter: Math.max(
        Math.ceil((bucket.resetAt.getTime() - bucket.observedAt.getTime()) / 1000),
        1,
      ),
    }
  }

  async cleanupExpired(): Promise<number> {
    if (Date.now() < this.nextCleanupAt) return 0
    this.nextCleanupAt = Date.now() + 60_000
    const deadline = Date.now() + 1_000
    let removed = 0
    try {
      for (let batch = 0; batch < 10; batch += 1) {
        const count = await this.database.$executeRaw`
          DELETE FROM "auth_rate_limit_buckets"
          WHERE "key" IN (
            SELECT "key" FROM "auth_rate_limit_buckets"
            WHERE "resetAt" <= date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
            ORDER BY "resetAt", "key" LIMIT 100 FOR UPDATE SKIP LOCKED
          ) AND "resetAt" <= date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
        `
        removed += count
        if (count < 100) return removed
        if (Date.now() >= deadline) break
      }
      this.nextCleanupAt = Date.now() + 1_000
    } catch {
      this.nextCleanupAt = Date.now() + 5_000
      console.error('[rate-limit] Counter cleanup failed; retry scheduled.')
    }
    return removed
  }
}
