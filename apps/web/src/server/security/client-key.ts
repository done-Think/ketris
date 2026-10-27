import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

function firstAddress(value: string | null): string {
  const candidate = value?.split(',')[0]?.trim() ?? ''
  if (isIP(candidate)) return candidate
  const withoutPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(candidate)?.[1]
  return withoutPort && isIP(withoutPort) ? withoutPort : 'unknown'
}

export function getTrustedClientAddress(headers: Headers): string {
  if (process.env.VERCEL === '1') return firstAddress(headers.get('x-vercel-forwarded-for'))

  const trustedHeader = process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase()
  return trustedHeader ? firstAddress(headers.get(trustedHeader)) : 'local'
}

export function getAuthRateLimitKey(headers: Headers): string {
  const secret = process.env.AUTH_TOKEN_SECRET
  if (!secret) throw new Error('Auth rate limit secret is unavailable.')

  return createHmac('sha256', secret)
    .update('ketris:auth-rate-limit:v1\0')
    .update(getTrustedClientAddress(headers))
    .digest('hex')
}
