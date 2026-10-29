import { timingSafeEqual } from 'node:crypto'

import type { EmailVerificationRecord } from '../types/email-verification'
import { InvalidEmailVerificationCodeError } from './errors'
import { hashPasswordResetCode } from './password-reset-code'

export const EMAIL_VERIFICATION_TTL_MINUTES = 10
export const EMAIL_VERIFICATION_MAX_ATTEMPTS = 5
export const EMAIL_VERIFICATION_RESEND_SECONDS = 60

export function emailVerificationExpiryDate(now = new Date()): Date {
  return new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MINUTES * 60_000)
}

export function assertEmailCodeCanBeUsed(
  record: EmailVerificationRecord | null,
): asserts record is EmailVerificationRecord {
  if (
    !record ||
    record.consumedAt ||
    record.expiresAt.getTime() <= Date.now() ||
    record.attempts >= EMAIL_VERIFICATION_MAX_ATTEMPTS
  ) {
    throw new InvalidEmailVerificationCodeError()
  }
}

export function emailCodeMatches(hash: string, code: string): boolean {
  const actual = Buffer.from(hash, 'hex')
  const expected = Buffer.from(hashPasswordResetCode(code), 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
