import type { Papel } from '@server/auth/domain/user.entity'

import type { Opportunity } from '../../domain/opportunity.entity'
import type {
  OpportunityListFilters,
  OpportunityRepository,
} from '../ports/opportunity-repository.port'

export interface ListOpportunitiesInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  filters?: OpportunityListFilters
}

export type ListOpportunitiesOutput = Opportunity[]

export class ListOpportunitiesUseCase {
  constructor(private readonly opportunityRepository: OpportunityRepository) {}

  execute(input: ListOpportunitiesInput): Promise<ListOpportunitiesOutput> {
    return this.opportunityRepository.findManyByTenant(input.actorTenantId, {
      ...input.filters,
      responsavelId: input.actorPapel === 'AGENT' ? input.actorId : undefined,
    })
  }
}
