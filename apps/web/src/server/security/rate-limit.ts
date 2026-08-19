import type {
  RateLimitInput,
  RateLimitPolicy,
  RateLimitResult,
  RateLimitStore,
} from './types/rate-limit.types'

interface RateLimitEntry {
  count: number
  resetAt: number
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, RateLimitEntry>()

  consume(input: RateLimitInput): RateLimitResult {
    const now = input.now ?? Date.now()
    const entryKey = `${input.policy.name}:${input.key}`
    const current = this.entries.get(entryKey)
    const entry =
      current && current.resetAt > now
        ? current
        : { count: 0, resetAt: now + input.policy.windowMs }

    if (entry.count >= input.policy.limit) {
      this.entries.set(entryKey, entry)

      return toResult(input.policy, entry, false, now)
    }

    entry.count += 1
    this.entries.set(entryKey, entry)
    this.prune(now)

    return toResult(input.policy, entry, true, now)
  }

  reset() {
    this.entries.clear()
  }

  size() {
    return this.entries.size
  }

  private prune(now: number) {
    if (this.entries.size < 10_000) {
      return
    }

    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) {
        this.entries.delete(key)
      }
    }
  }
}

export function createRateLimitPolicy(
  name: string,
  limit: number,
  windowMs: number,
): RateLimitPolicy {
  return { name, limit, windowMs }
}

function toResult(
  policy: RateLimitPolicy,
  entry: RateLimitEntry,
  allowed: boolean,
  now: number,
): RateLimitResult {
  return {
    allowed,
    limit: policy.limit,
    remaining: Math.max(policy.limit - entry.count, 0),
    resetAt: entry.resetAt,
    retryAfter: Math.max(Math.ceil((entry.resetAt - now) / 1000), 1),
  }
}
