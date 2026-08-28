import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'
import { createRateLimitPolicy, InMemoryRateLimitStore } from '@server/security/rate-limit'
import type { RateLimitPolicy, RateLimitResult } from '@server/security/types/rate-limit.types'

const store = new InMemoryRateLimitStore()
const handleI18nRouting = createMiddleware(routing)

const apiPolicy = createRateLimitPolicy(
  'api',
  toPositiveInteger(process.env.API_RATE_LIMIT_MAX, 300),
  toPositiveInteger(process.env.API_RATE_LIMIT_WINDOW_MS, 60_000),
)

const authPolicy = createRateLimitPolicy(
  'auth',
  toPositiveInteger(process.env.AUTH_RATE_LIMIT_MAX, 10),
  toPositiveInteger(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60_000),
)

const authPaths = new Set([
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/platform/login',
  '/api/platform/refresh',
])

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return handleI18nRouting(request)
  }

  const policy = selectPolicy(request.nextUrl.pathname)
  const result = store.consume({
    key: getClientKey(request),
    policy,
  })

  if (!result.allowed) {
    return withRateLimitHeaders(
      NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Muitas requisições. Tente novamente mais tarde.',
          },
        },
        { status: 429 },
      ),
      result,
    )
  }

  return withRateLimitHeaders(NextResponse.next(), result)
}

export const config = {
  matcher: ['/api/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
}

function selectPolicy(pathname: string): RateLimitPolicy {
  return authPaths.has(pathname) ? authPolicy : apiPolicy
}

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()

  return forwardedFor || realIp || 'unknown'
}

function withRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('RateLimit-Limit', String(result.limit))
  response.headers.set('RateLimit-Remaining', String(result.remaining))
  response.headers.set('RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))

  if (!result.allowed) {
    response.headers.set('Retry-After', String(result.retryAfter))
  }

  return response
}

function toPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}
