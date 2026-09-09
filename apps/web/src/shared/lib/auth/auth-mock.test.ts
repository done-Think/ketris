import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildMockTenantUser, isAuthMockEnabled, matchesMockCredentials } from './auth-mock'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isAuthMockEnabled', () => {
  it('never enables when VERCEL_ENV is production, regardless of the flag', () => {
    vi.stubEnv('AUTH_MOCK_ENABLED', 'true')
    vi.stubEnv('VERCEL_ENV', 'production')

    expect(isAuthMockEnabled()).toBe(false)
  })

  it('never enables a production build with no VERCEL_ENV set', () => {
    vi.stubEnv('AUTH_MOCK_ENABLED', 'true')
    vi.stubEnv('VERCEL_ENV', undefined)
    vi.stubEnv('NODE_ENV', 'production')

    expect(isAuthMockEnabled()).toBe(false)
  })

  it('stays disabled by default even outside production', () => {
    vi.stubEnv('AUTH_MOCK_ENABLED', undefined)
    vi.stubEnv('VERCEL_ENV', 'preview')

    expect(isAuthMockEnabled()).toBe(false)
  })

  it('enables on a Vercel Preview deploy with the flag set', () => {
    vi.stubEnv('AUTH_MOCK_ENABLED', 'true')
    vi.stubEnv('VERCEL_ENV', 'preview')

    expect(isAuthMockEnabled()).toBe(true)
  })

  it('enables in local development with the flag set', () => {
    vi.stubEnv('AUTH_MOCK_ENABLED', 'true')
    vi.stubEnv('VERCEL_ENV', undefined)
    vi.stubEnv('NODE_ENV', 'development')

    expect(isAuthMockEnabled()).toBe(true)
  })
})

describe('matchesMockCredentials', () => {
  it('matches the default demo credentials', () => {
    vi.stubEnv('AUTH_MOCK_EMAIL', undefined)
    vi.stubEnv('AUTH_MOCK_PASSWORD', undefined)

    expect(matchesMockCredentials('demo@ketris.dev', 'demo123456')).toBe(true)
  })

  it('rejects any other credential', () => {
    expect(matchesMockCredentials('demo@ketris.dev', 'wrong')).toBe(false)
    expect(matchesMockCredentials('someone@else.com', 'demo123456')).toBe(false)
  })

  it('honors overrides from the environment', () => {
    vi.stubEnv('AUTH_MOCK_EMAIL', 'preview@ketris.dev')
    vi.stubEnv('AUTH_MOCK_PASSWORD', 'preview-pass')

    expect(matchesMockCredentials('preview@ketris.dev', 'preview-pass')).toBe(true)
    expect(matchesMockCredentials('demo@ketris.dev', 'demo123456')).toBe(false)
  })
})

describe('buildMockTenantUser', () => {
  it('returns a fixed tenant-scoped user with no real tokens', () => {
    const user = buildMockTenantUser()

    expect(user.scope).toBe('tenant')
    expect(user.tenantId).toBe('mock-tenant')
    expect(user.accessToken).toBe('mock-access-token')
    expect(user.refreshToken).toBe('mock-refresh-token')
  })
})
