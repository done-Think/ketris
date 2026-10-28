import type {
  ListOpportunitiesInput,
  ListOpportunitiesOutput,
} from '../../types/list-opportunities.use-case.types'
export type {
  ListOpportunitiesInput,
  ListOpportunitiesOutput,
} from '../../types/list-opportunities.use-case.types'

import { assertCrmAccess } from '../authorization'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class ListOpportunitiesUseCase {
  constructor(private readonly opportunityRepository: OpportunityRepository) {}

  execute(input: ListOpportunitiesInput): Promise<ListOpportunitiesOutput> {
    assertCrmAccess(input.actorRole)
    return this.opportunityRepository.findManyByTenant(input.actorTenantId, {
      ...input.filters,
      responsibleId: input.actorRole === 'AGENT' ? input.actorId : undefined,
    })
  }
}
