import { createHash, randomBytes } from 'node:crypto'

export const TEAM_INVITATION_TTL_DAYS = 7

export function generateTeamInvitationToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashTeamInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function teamInvitationExpiry(now: Date): Date {
  return new Date(now.getTime() + TEAM_INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000)
}

export function generateUnusablePassword(): string {
  return randomBytes(48).toString('base64url')
}
