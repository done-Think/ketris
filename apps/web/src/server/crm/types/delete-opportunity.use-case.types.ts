import type { Papel } from '@server/auth/domain/user.entity'

export interface DeleteOpportunityInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  opportunityId: string
}
