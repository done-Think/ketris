import type { Prisma } from '@prisma/client'

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
  consume(input: RateLimitInput): RateLimitResult | Promise<RateLimitResult>
}

export interface StoredRateLimitBucket {
  count: number
  resetAt: Date
  observedAt: Date
}

export type RateLimitDatabase = Pick<Prisma.TransactionClient, '$queryRaw' | '$executeRaw'>
