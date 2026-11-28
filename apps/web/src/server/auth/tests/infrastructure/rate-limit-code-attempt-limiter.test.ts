import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InMemoryRateLimitStore } from '@server/security/rate-limit'
import type { RateLimitCounterStore } from '@server/security/types/rate-limit.types'

import { RateLimitCodeAttemptLimiter } from '../../infrastructure/rate-limit-code-attempt-limiter'

async function fail(limiter: RateLimitCodeAttemptLimiter, email: string, times: number) {
  for (let index = 0; index < times; index += 1) {
    await limiter.recordFailure('PASSWORD_RESET', email)
  }
}

describe('RateLimitCodeAttemptLimiter', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_TOKEN_SECRET', 'test-secret')
  })

  it('is not blocked until 10 failures accumulate in the hour, regardless of code replacement', async () => {
    const limiter = new RateLimitCodeAttemptLimiter(new InMemoryRateLimitStore())

    await fail(limiter, 'ana@example.test', 9)
    expect(await limiter.isBlocked('PASSWORD_RESET', 'ana@example.test')).toBe(false)
    await fail(limiter, 'ana@example.test', 1)
    expect(await limiter.isBlocked('PASSWORD_RESET', 'ana@example.test')).toBe(true)
  })

  it('checking the budget never spends it', async () => {
    const limiter = new RateLimitCodeAttemptLimiter(new InMemoryRateLimitStore())
    for (let index = 0; index < 50; index += 1) {
      expect(await limiter.isBlocked('PASSWORD_RESET', 'ana@example.test')).toBe(false)
    }
  })

  it('keeps separate budgets per e-mail and per flow', async () => {
    const limiter = new RateLimitCodeAttemptLimiter(new InMemoryRateLimitStore())
    await fail(limiter, 'ana@example.test', 10)

    expect(await limiter.isBlocked('PASSWORD_RESET', 'bia@example.test')).toBe(false)
    expect(await limiter.isBlocked('SIGNUP_VERIFICATION', 'ana@example.test')).toBe(false)
    expect(await limiter.isBlocked('EMAIL_CHANGE', 'ana@example.test')).toBe(false)
    expect(await limiter.isBlocked('PASSWORD_RESET', 'ana@example.test')).toBe(true)
  })

  it('enforces the daily budget even when each hourly window is fresh', async () => {
    const memory = new InMemoryRateLimitStore()
    const store: RateLimitCounterStore = {
      consume: (input) => memory.consume(input),
      peek: (input) => (input.policy.name.endsWith('hour') ? 0 : memory.peek(input)),
    }
    const limiter = new RateLimitCodeAttemptLimiter(store)

    await fail(limiter, 'ana@example.test', 29)
    expect(await limiter.isBlocked('PASSWORD_RESET', 'ana@example.test')).toBe(false)
    await fail(limiter, 'ana@example.test', 1)
    expect(await limiter.isBlocked('PASSWORD_RESET', 'ana@example.test')).toBe(true)
  })

  it('never stores the raw e-mail address in the counter key', async () => {
    const keys: string[] = []
    const limiter = new RateLimitCodeAttemptLimiter({
      consume: (input) => {
        keys.push(input.key)
        return { allowed: true, limit: 1, remaining: 1, resetAt: 0, retryAfter: 1 }
      },
      peek: (input) => {
        keys.push(input.key)
        return 0
      },
    })
    await limiter.isBlocked('EMAIL_CHANGE', 'ana@example.test')
    await limiter.recordFailure('EMAIL_CHANGE', 'ana@example.test')
    expect(keys.length).toBe(4)
    expect(keys.join()).not.toContain('ana@example.test')
    expect(keys[0]).toMatch(/^EMAIL_CHANGE:[0-9a-f]{64}$/)
  })
})
