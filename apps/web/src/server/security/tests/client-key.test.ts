import { afterEach, describe, expect, it, vi } from 'vitest'

import { getAuthRateLimitKey, getTrustedClientAddress } from '../client-key'

afterEach(() => vi.unstubAllEnvs())

describe('trusted auth rate-limit identity', () => {
  it('ignores all caller-supplied forwarding headers outside Vercel without a trusted proxy', () => {
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', '')
    expect(
      getTrustedClientAddress(
        new Headers({
          'x-forwarded-for': '203.0.113.1',
          'x-real-ip': '203.0.113.2',
          'x-vercel-forwarded-for': '203.0.113.3',
        }),
      ),
    ).toBe('local')
  })

  it('only trusts the Vercel-managed header on Vercel', () => {
    vi.stubEnv('VERCEL', '1')
    expect(
      getTrustedClientAddress(
        new Headers({
          'x-forwarded-for': '203.0.113.1',
          'x-real-ip': '203.0.113.2',
          'x-vercel-forwarded-for': '203.0.113.3',
        }),
      ),
    ).toBe('203.0.113.3')
    expect(getTrustedClientAddress(new Headers({ 'x-forwarded-for': '203.0.113.1' }))).toBe(
      'unknown',
    )
    expect(getTrustedClientAddress(new Headers({ 'x-vercel-forwarded-for': 'forged' }))).toBe(
      'unknown',
    )
  })

  it('uses only the header named by the trusted proxy outside Vercel', () => {
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', 'CloudFront-Viewer-Address')
    const headers = {
      'x-forwarded-for': '203.0.113.1',
      'x-vercel-forwarded-for': '203.0.113.3',
    }
    expect(
      getTrustedClientAddress(
        new Headers({ ...headers, 'cloudfront-viewer-address': '198.51.100.7:46532' }),
      ),
    ).toBe('198.51.100.7')
    expect(
      getTrustedClientAddress(
        new Headers({ 'cloudfront-viewer-address': '2001:db8::1, 198.51.100.8' }),
      ),
    ).toBe('2001:db8::1')
    expect(getTrustedClientAddress(new Headers(headers))).toBe('unknown')
    expect(getTrustedClientAddress(new Headers({ 'cloudfront-viewer-address': 'forged' }))).toBe(
      'unknown',
    )
  })

  it('stores a stable secret HMAC rather than a raw IP or unsalted hash', () => {
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('AUTH_TOKEN_SECRET', 'test-secret-one')
    const headers = new Headers({ 'x-vercel-forwarded-for': '203.0.113.1' })
    const first = getAuthRateLimitKey(headers)
    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(getAuthRateLimitKey(headers)).toBe(first)
    vi.stubEnv('AUTH_TOKEN_SECRET', 'test-secret-two')
    expect(getAuthRateLimitKey(headers)).not.toBe(first)
  })

  it.each(['2001:db8::1', '::ffff:192.0.2.1'])(
    'normalizes bracketed IPv6 %s with a port without creating a new quota',
    (address) => {
      vi.stubEnv('VERCEL', '')
      vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', 'CloudFront-Viewer-Address')
      vi.stubEnv('AUTH_TOKEN_SECRET', 'test-secret')
      const first = new Headers({ 'cloudfront-viewer-address': `[${address}]:12345` })
      const second = new Headers({ 'cloudfront-viewer-address': `[${address}]:54321` })
      expect(getTrustedClientAddress(first)).toBe(address)
      expect(getAuthRateLimitKey(first)).toBe(getAuthRateLimitKey(second))
    },
  )

  it('requires a configured secret', () => {
    vi.stubEnv('AUTH_TOKEN_SECRET', '')
    expect(() => getAuthRateLimitKey(new Headers())).toThrow()
  })
})
