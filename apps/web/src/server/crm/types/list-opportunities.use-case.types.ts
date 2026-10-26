import type { Papel } from '@server/auth/domain/user.entity'
import type { OpportunityListFilters } from '../application/ports/opportunity-repository.port'
import type { Opportunity } from '../domain/opportunity.entity'
import type { CrmPage } from './pagination'

export interface ListOpportunitiesInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  filters?: OpportunityListFilters
}

export type ListOpportunitiesOutput = CrmPage<Opportunity>
