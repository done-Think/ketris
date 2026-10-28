import { createHmac } from 'node:crypto'

import { createRateLimitPolicy } from '@server/security/rate-limit'
import { InquiryRateLimitUnavailableError } from '../domain/errors'

export function inquiryContactRateLimitPolicy() {
  return createRateLimitPolicy(
    'marketplace-property-contact',
    positiveInteger(process.env.MARKETPLACE_CONTACT_INQUIRY_LIMIT, 3),
    positiveInteger(process.env.MARKETPLACE_CONTACT_INQUIRY_WINDOW_MS, 24 * 60 * 60_000),
  )
}

export function inquiryContactRateLimitKey(propertyId: string, email: string) {
  const secret = process.env.AUTH_TOKEN_SECRET
  if (!secret) throw new InquiryRateLimitUnavailableError()
  return createHmac('sha256', secret)
    .update(
      JSON.stringify(['marketplace-property-contact:v1', propertyId, email.trim().toLowerCase()]),
    )
    .digest('hex')
}

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
