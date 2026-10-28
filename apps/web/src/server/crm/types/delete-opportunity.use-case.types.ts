import type { UserRole } from '@server/auth/domain/user.entity'

export interface DeleteOpportunityInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  opportunityId: string
}
