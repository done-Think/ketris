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
    assertCrmAccess(input.actorPapel)
    return this.opportunityRepository.findManyByTenant(input.actorTenantId, {
      ...input.filters,
      responsavelId: input.actorPapel === 'AGENT' ? input.actorId : undefined,
    })
  }
}
