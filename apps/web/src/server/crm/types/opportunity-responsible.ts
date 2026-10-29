import type { UserRole } from '@server/auth/domain/user.entity'

export interface OpportunityResponsible {
  id: string
  name: string
  role: Extract<UserRole, 'OWNER' | 'AGENT'>
}

export interface ListOpportunityResponsiblesInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
}
