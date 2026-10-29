import { NextRequest } from 'next/server'
import type { RateLimitInput } from '../types/rate-limit.types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: vi.fn(),
}))

// O roteamento de idioma não participa das rotas /api e o build ESM do next-intl não resolve
// `next/server` no Vitest.
vi.mock('next-intl/middleware', () => ({ default: () => () => new Response(null) }))

const { unavailable } = vi.hoisted(() => ({ unavailable: vi.fn() }))
vi.mock('../postgres-rate-limit-store', async () => {
  const { InMemoryRateLimitStore } =
    await vi.importActual<typeof import('../rate-limit')>('../rate-limit')
  return {
    PostgresRateLimitStore: class {
      private readonly store = new InMemoryRateLimitStore()
      async consume(input: RateLimitInput) {
        unavailable()
        return this.store.consume(input)
      }
      async cleanupExpired() {
        return 0
      }
    },
  }
})

function postFrom(ip: string, pathname: string) {
  return new NextRequest(`http://localhost${pathname}`, {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, 'X-Ketris-Api-Version': '2' },
  })
}

describe('proxy rate limit', () => {
  beforeEach(() => {
    vi.resetModules()
    unavailable.mockReset()
    vi.stubEnv('AUTH_TOKEN_SECRET', 'test-rate-limit-key-secret')
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '10')
    vi.stubEnv('AUTH_RATE_LIMIT_WINDOW_MS', '900000')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it('identifies the deployed commit for release verification', async () => {
    vi.stubEnv('KETRIS_RELEASE_SHA', 'a'.repeat(40))
    const { proxy } = await import('../../../proxy')
    const response = await proxy(postFrom('203.0.113.10', '/api/marketplace/stats'))
    expect(response.headers.get('X-Ketris-Release-Sha')).toBe('a'.repeat(40))
  })

  it('does not publish an invalid release identifier', async () => {
    vi.stubEnv('KETRIS_RELEASE_SHA', 'not-a-release-sha')
    const { proxy } = await import('../../../proxy')
    const response = await proxy(postFrom('203.0.113.10', '/api/marketplace/stats'))
    expect(response.headers.has('X-Ketris-Release-Sha')).toBe(false)
  })

  it.each([
    '/api/auth/me/password',
    '/api/auth/email-verification-codes',
    '/api/auth/email-verification-codes/verify',
    '/api/auth/me/email-change',
    '/api/auth/me/email-change/verify',
    '/api/auth/callback/credentials',
    '/api/auth/callback/platform-credentials',
    '/api/auth/callback/token-session',
    '/api/auth/callback/platform-credentials/',
    '/api/auth/callback/platform-credentials/extra-segment',
    '/api/auth/callback/%70latform-credentials',
    '/api/auth/%63allback/platform-credentials',
  ])('applies the strict auth policy to %s', async (pathname) => {
    const { proxy } = await import('../../../proxy')
    const ip = '203.0.113.10'
    const responses = await Promise.all(
      Array.from({ length: 11 }, () => proxy(postFrom(ip, pathname))),
    )

    expect(responses.slice(0, 10).every((response) => response.status !== 429)).toBe(true)
    expect(responses[10].status).toBe(429)
    expect(responses[10].headers.get('RateLimit-Limit')).toBe('10')
    expect(responses[10].headers.get('Retry-After')).toBe('900')
  })

  it.each(['/api/crm/leads', '/api/auth/session', '/api/auth/csrf'])(
    'keeps %s on the permissive policy',
    async (pathname) => {
      const { proxy } = await import('../../../proxy')
      const responses = await Promise.all(
        Array.from({ length: 11 }, () => proxy(postFrom('203.0.113.11', pathname))),
      )
      const statuses = responses.map((response) => response.status)

      expect(statuses).not.toContain(429)
    },
  )

  it('limits public marketplace proposals per client on the shared counter', async () => {
    const { proxy } = await import('../../../proxy')
    const ip = '203.0.113.20'
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const pathname = `/api/marketplace/properties/property-${attempt % 2}/inquiries`
      expect((await proxy(postFrom(ip, pathname))).status).not.toBe(429)
    }

    const blocked = await proxy(postFrom(ip, '/api/marketplace/properties/property-9/inquiries/'))
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('RateLimit-Limit')).toBe('5')
    expect(blocked.headers.get('Retry-After')).toBe('600')
    expect(unavailable).toHaveBeenCalledTimes(6)
    expect((await proxy(postFrom(ip, '/api/marketplace/properties'))).status).not.toBe(429)
  })

  it('shares the auth budget between the REST login and NextAuth callbacks', async () => {
    const { proxy } = await import('../../../proxy')
    const ip = '203.0.113.12'
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const pathname = attempt % 2 ? '/api/platform/login' : '/api/auth/login'
      expect((await proxy(postFrom(ip, pathname))).status).not.toBe(429)
    }

    expect((await proxy(postFrom(ip, '/api/auth/callback/platform-credentials'))).status).toBe(429)
    expect((await proxy(postFrom(ip, '/api/auth/callback/credentials'))).status).toBe(429)
  })

  it('uses the configured auth limit and window and allows attempts after expiration', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-24T12:00:00Z'))
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '2')
    vi.stubEnv('AUTH_RATE_LIMIT_WINDOW_MS', '5000')
    const { proxy } = await import('../../../proxy')
    const ip = '203.0.113.11'
    const request = () => postFrom(ip, '/api/auth/callback/platform-credentials')

    expect((await proxy(request())).headers.get('RateLimit-Limit')).toBe('2')
    expect((await proxy(request())).status).not.toBe(429)
    const blocked = await proxy(request())
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('Retry-After')).toBe('5')

    vi.advanceTimersByTime(5000)
    expect((await proxy(request())).status).not.toBe(429)
  })
  it('fails closed with 503 when any shared counter is unavailable', async () => {
    unavailable.mockImplementation(() => {
      throw new Error('database unavailable')
    })
    const { proxy } = await import('../../../proxy')
    const response = await proxy(
      postFrom('203.0.113.10', '/api/auth/callback/platform-credentials'),
    )
    expect(response.status).toBe(503)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect(await response.json()).toMatchObject({ error: { code: 'AUTH_RATE_LIMIT_UNAVAILABLE' } })
    const general = await proxy(postFrom('203.0.113.10', '/api/crm/leads'))
    expect(general.status).toBe(503)
    expect(await general.json()).toMatchObject({ error: { code: 'API_RATE_LIMIT_UNAVAILABLE' } })
    expect(general.headers.get('Cache-Control')).toBe('no-store')
  })

  it.each([
    [
      'pt-BR',
      'Serviço temporariamente indisponível.',
      'Muitas requisições. Tente novamente mais tarde.',
    ],
    ['en-US', 'Service temporarily unavailable.', 'Too many requests. Please try again later.'],
    [
      'es-ES',
      'Servicio temporalmente no disponible.',
      'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
    ],
  ])(
    'localizes unavailable and exceeded counters in %s',
    async (locale, unavailableMessage, exceededMessage) => {
      vi.stubEnv('AUTH_RATE_LIMIT_MAX', '1')
      const { proxy } = await import('../../../proxy')
      const request = () => {
        const input = postFrom('203.0.113.20', '/api/auth/login')
        input.headers.set('Accept-Language', locale)
        return input
      }
      const allowed = await proxy(request())
      expect(allowed.headers.get('Server-Timing')).toMatch(/^rate-limit;dur=\d+\.\d{2}$/)
      const blocked = await proxy(request())
      expect(blocked.status).toBe(429)
      expect(await blocked.json()).toMatchObject({
        error: { code: 'RATE_LIMIT_EXCEEDED', message: exceededMessage },
      })
      unavailable.mockImplementation(() => {
        throw new Error('unavailable')
      })
      const failed = await proxy(request())
      expect(failed.status).toBe(503)
      expect(await failed.json()).toMatchObject({
        error: { code: 'AUTH_RATE_LIMIT_UNAVAILABLE', message: unavailableMessage },
      })
    },
  )

  it('does not let forged forwarding headers create fresh auth budgets outside Vercel', async () => {
    const { proxy } = await import('../../../proxy')
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await proxy(postFrom(`203.0.113.${attempt}`, '/api/auth/login'))).status).not.toBe(
        429,
      )
    }
    expect((await proxy(postFrom('198.51.100.1', '/api/auth/login'))).status).toBe(429)
  })

  it.each(['GET', 'POST', 'PATCH', 'DELETE'])(
    'stops an old %s client before forwarding the operation',
    async (method) => {
      const { proxy } = await import('../../../proxy')
      const response = await proxy(
        new NextRequest('http://localhost/api/properties/property-1', { method }),
      )
      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({ error: { code: 'CLIENT_UPDATE_REQUIRED' } })
      expect(response.headers.get('x-middleware-next')).toBeNull()
      expect(response.headers.get('X-Ketris-Api-Version')).toBe('2')
    },
  )

  it.each([
    '/api/auth/csrf',
    '/api/auth/session',
    '/api/auth/callback/credentials',
    '/api/docs/openapi.json',
    '/api/properties/media/photo.png',
  ])('keeps the unchanged protocol of %s available', async (pathname) => {
    const { proxy } = await import('../../../proxy')
    const response = await proxy(new NextRequest(`http://localhost${pathname}`))
    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })
})
