import type { Papel } from '@server/auth/domain/user.entity'

export interface OpportunityResponsible {
  id: string
  name: string
  role: Extract<Papel, 'OWNER' | 'AGENT'>
}

export interface ListOpportunityResponsiblesInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
}
