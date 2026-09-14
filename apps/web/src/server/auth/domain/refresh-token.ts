import { createHash, randomBytes } from 'node:crypto'

export const REFRESH_TOKEN_TTL_DAYS = 30

export function generateRefreshToken(): string {
  return randomBytes(64).toString('hex')
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function refreshTokenExpiryDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
}
