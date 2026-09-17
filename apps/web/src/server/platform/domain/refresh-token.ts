import { createHash, randomBytes } from 'node:crypto'

export const PLATFORM_REFRESH_TOKEN_TTL_DAYS = 30

export function generatePlatformRefreshToken(): string {
  return randomBytes(64).toString('hex')
}

export function hashPlatformRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function platformRefreshTokenExpiryDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + PLATFORM_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
}
