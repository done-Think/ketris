import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

export function getTrustedClientAddress(headers: Headers): string {
  if (process.env.VERCEL !== '1') return 'local'

  const address = headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
  return address && isIP(address) ? address : 'unknown'
}

export function getAuthRateLimitKey(headers: Headers): string {
  const secret = process.env.AUTH_TOKEN_SECRET
  if (!secret) throw new Error('Auth rate limit secret is unavailable.')

  return createHmac('sha256', secret)
    .update('ketris:auth-rate-limit:v1\0')
    .update(getTrustedClientAddress(headers))
    .digest('hex')
}
