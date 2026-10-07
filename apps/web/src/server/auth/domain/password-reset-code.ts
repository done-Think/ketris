import { createHash, randomInt } from 'node:crypto'

export const PASSWORD_RESET_CODE_TTL_MINUTES = 10
export const PASSWORD_RESET_CODE_MAX_ATTEMPTS = 5
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 5

export function generatePasswordResetCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export function hashPasswordResetCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function passwordResetCodeExpiryDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + PASSWORD_RESET_CODE_TTL_MINUTES * 60 * 1000)
}
