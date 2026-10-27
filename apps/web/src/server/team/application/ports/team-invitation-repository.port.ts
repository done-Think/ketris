import type { NewTeamInvitation, StoredTeamInvitation } from '../../types/team-repository'

export interface TeamInvitationRepository {
  isEmailInUse(tenantId: string, email: string): Promise<boolean>
  create(invitation: NewTeamInvitation): Promise<StoredTeamInvitation>
  findPendingByUser(tenantId: string, userId: string): Promise<StoredTeamInvitation | null>
  replaceToken(
    tenantId: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    now: Date,
  ): Promise<boolean>
  hasPortfolio(tenantId: string, userId: string): Promise<boolean>
  deleteInvitedUser(tenantId: string, userId: string): Promise<boolean>
  findByTokenHash(tokenHash: string): Promise<StoredTeamInvitation | null>
  accept(tokenHash: string, passwordHash: string, now: Date): Promise<boolean>
}
