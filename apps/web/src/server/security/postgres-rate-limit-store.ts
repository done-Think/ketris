import { prisma } from '@server/db/prisma'

import type {
  RateLimitInput,
  RateLimitResult,
  RateLimitStore,
  StoredRateLimitBucket,
} from './types/rate-limit.types'

export class PostgresRateLimitStore implements RateLimitStore {
  private nextCleanupAt = 0

  async consume(input: RateLimitInput): Promise<RateLimitResult> {
    const key = `${input.policy.name}:${input.key}`
    const { limit, windowMs } = input.policy
    const [bucket] = await prisma.$queryRaw<StoredRateLimitBucket[]>`
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

    if (!bucket) throw new Error('Contador de tentativas de autenticação indisponível.')

    if (Date.now() >= this.nextCleanupAt) {
      await prisma.$executeRaw`
        DELETE FROM "auth_rate_limit_buckets"
        WHERE "key" IN (
          SELECT "key" FROM "auth_rate_limit_buckets"
          WHERE "resetAt" <= date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
          ORDER BY "resetAt" LIMIT 100
        ) AND "resetAt" <= date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
      `
      this.nextCleanupAt = Date.now() + 60_000
    }

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
}
