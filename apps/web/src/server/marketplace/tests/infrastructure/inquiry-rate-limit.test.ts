import { afterEach, describe, expect, it, vi } from 'vitest'

import { InquiryRateLimitUnavailableError } from '../../domain/errors'
import {
  inquiryContactRateLimitKey,
  inquiryContactRateLimitPolicy,
} from '../../infrastructure/inquiry-rate-limit'

describe('inquiry contact quota identity', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('shares a private key for different casing of the same property and email', () => {
    vi.stubEnv('AUTH_TOKEN_SECRET', 'test-secret')
    const key = inquiryContactRateLimitKey('property-one', '  Visitor@Example.test  ')
    expect(key).toBe(inquiryContactRateLimitKey('property-one', 'visitor@example.test'))
    expect(key).toMatch(/^[a-f0-9]{64}$/)
    expect(key).not.toContain('visitor')
    expect(key).not.toBe(inquiryContactRateLimitKey('property-two', 'visitor@example.test'))
  })

  it('fails closed when the hashing secret is unavailable', () => {
    vi.stubEnv('AUTH_TOKEN_SECRET', '')
    expect(() => inquiryContactRateLimitKey('property', 'visitor@example.test')).toThrow(
      InquiryRateLimitUnavailableError,
    )
  })

  it('supports configured positive budgets with safe fallbacks', () => {
    vi.stubEnv('MARKETPLACE_CONTACT_INQUIRY_LIMIT', '2')
    vi.stubEnv('MARKETPLACE_CONTACT_INQUIRY_WINDOW_MS', '60000')
    expect(inquiryContactRateLimitPolicy()).toMatchObject({ limit: 2, windowMs: 60000 })
    vi.stubEnv('MARKETPLACE_CONTACT_INQUIRY_LIMIT', '-1')
    vi.stubEnv('MARKETPLACE_CONTACT_INQUIRY_WINDOW_MS', 'not-a-number')
    expect(inquiryContactRateLimitPolicy()).toMatchObject({ limit: 3, windowMs: 86400000 })
  })
})
