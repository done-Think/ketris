import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'
import { createRateLimitPolicy } from '@server/security/rate-limit'
import type { RateLimitPolicy, RateLimitResult } from '@server/security/types/rate-limit.types'
import { getAuthRateLimitKey } from '@server/security/client-key'
import { PostgresRateLimitStore } from '@server/security/postgres-rate-limit-store'
import { validateApiContract } from '@server/shared/http/api-contract'
import {
  API_CONTRACT_HEADER,
  API_CONTRACT_VERSION,
  requiresApiContract,
} from '@shared/config/api-contract'

const store = new PostgresRateLimitStore()
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

const inquiryPolicy = createRateLimitPolicy(
  'marketplace-inquiry',
  toPositiveInteger(process.env.MARKETPLACE_INQUIRY_RATE_LIMIT_MAX, 5),
  toPositiveInteger(process.env.MARKETPLACE_INQUIRY_RATE_LIMIT_WINDOW_MS, 10 * 60_000),
)

const inquiryPathPattern = /^\/api\/marketplace\/properties\/[^/]+\/inquiries$/

const authPaths = new Set([
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/platform/login',
  '/api/platform/refresh',
  '/api/register',
  '/api/auth/reset-password',
  '/api/auth/password-reset-codes',
  '/api/auth/password-reset-codes/verify',
  '/api/auth/email-verification-codes',
  '/api/auth/email-verification-codes/verify',
  '/api/auth/me/email-change',
  '/api/auth/me/email-change/verify',
  '/api/auth/email-change/verify',
  '/api/auth/me/password',
  '/api/team/invitations/accept',
])

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return handleI18nRouting(request)
  }

  const policy = selectPolicy(request.nextUrl.pathname)
  let result: RateLimitResult
  try {
    result = await store.consume({ key: getAuthRateLimitKey(request.headers), policy })
  } catch {
    return NextResponse.json(
      {
        error: {
          code:
            policy === authPolicy ? 'AUTH_RATE_LIMIT_UNAVAILABLE' : 'API_RATE_LIMIT_UNAVAILABLE',
          message: 'Serviço temporariamente indisponível.',
        },
      },
      {
        status: 503,
        headers: {
          'Retry-After': '60',
          'Cache-Control': 'no-store',
          'RateLimit-Limit': String(policy.limit),
          'RateLimit-Remaining': '0',
        },
      },
    )
  }

  if (!result.allowed) {
    return withRateLimitHeaders(
      NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Muitas requisições. Tente novamente mais tarde.',
          },
        },
        { status: 429, headers: { 'Cache-Control': 'no-store' } },
      ),
      result,
    )
  }

  const contractError = validateApiContract(request)
  const response = contractError ?? NextResponse.next()
  if (!contractError && requiresApiContract(request.nextUrl.pathname)) {
    response.headers.set(API_CONTRACT_HEADER, API_CONTRACT_VERSION)
    response.headers.append('Vary', API_CONTRACT_HEADER)
  }
  return withRateLimitHeaders(response, result)
}

export const config = {
  matcher: ['/api/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
}

function selectPolicy(pathname: string): RateLimitPolicy {
  let normalizedPathname = pathname
  try {
    normalizedPathname = decodeURIComponent(pathname)
  } catch {}
  normalizedPathname = normalizedPathname.replace(/\/+$/, '')

  if (inquiryPathPattern.test(normalizedPathname)) return inquiryPolicy

  return authPaths.has(normalizedPathname) ||
    normalizedPathname.startsWith('/api/auth/callback/') ||
    /^\/api\/auth\/users\/[^/]+\/email-change$/.test(normalizedPathname)
    ? authPolicy
    : apiPolicy
}

function withRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  const releaseSha = process.env.KETRIS_RELEASE_SHA
  if (releaseSha && /^[a-f0-9]{40}$/.test(releaseSha)) {
    response.headers.set('X-Ketris-Release-Sha', releaseSha)
  }
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
