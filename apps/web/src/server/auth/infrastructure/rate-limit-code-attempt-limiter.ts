import { createHmac } from 'node:crypto'

import { createRateLimitPolicy } from '@server/security/rate-limit'
import { PostgresRateLimitStore } from '@server/security/postgres-rate-limit-store'
import type { RateLimitCounterStore } from '@server/security/types/rate-limit.types'

import type {
  CodeAttemptLimiter,
  CodeAttemptScope,
} from '../application/ports/code-attempt-limiter.port'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const DEFAULT_HOURLY_LIMIT = 10
const DEFAULT_DAILY_LIMIT = 30

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function emailDigest(email: string): string {
  const secret = process.env.AUTH_TOKEN_SECRET
  if (!secret) throw new Error('Auth rate limit secret is unavailable.')
  return createHmac('sha256', secret)
    .update('ketris:code-attempts:v1\0')
    .update(email)
    .digest('hex')
}

export class RateLimitCodeAttemptLimiter implements CodeAttemptLimiter {
  private readonly hourly = createRateLimitPolicy(
    'auth-code-attempts-hour',
    positiveInteger(process.env.AUTH_CODE_ATTEMPTS_HOURLY_LIMIT, DEFAULT_HOURLY_LIMIT),
    HOUR_MS,
  )
  private readonly daily = createRateLimitPolicy(
    'auth-code-attempts-day',
    positiveInteger(process.env.AUTH_CODE_ATTEMPTS_DAILY_LIMIT, DEFAULT_DAILY_LIMIT),
    DAY_MS,
  )

  constructor(private readonly store: RateLimitCounterStore = new PostgresRateLimitStore()) {}

  private keyFor(scope: CodeAttemptScope, email: string): string {
    return `${scope}:${emailDigest(email)}`
  }

  async isBlocked(scope: CodeAttemptScope, email: string): Promise<boolean> {
    const key = this.keyFor(scope, email)
    for (const policy of [this.hourly, this.daily]) {
      if ((await this.store.peek({ key, policy })) >= policy.limit) return true
    }
    return false
  }

  async recordFailure(scope: CodeAttemptScope, email: string): Promise<void> {
    const key = this.keyFor(scope, email)
    for (const policy of [this.hourly, this.daily]) await this.store.consume({ key, policy })
  }
}
