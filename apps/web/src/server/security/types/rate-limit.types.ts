export interface RateLimitPolicy {
  name: string
  limit: number
  windowMs: number
}

export interface RateLimitInput {
  key: string
  policy: RateLimitPolicy
  now?: number
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfter: number
}

export interface RateLimitStore {
  consume(input: RateLimitInput): RateLimitResult
}
