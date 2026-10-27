import type {
  GetOpportunityInput,
  GetOpportunityOutput,
} from '../../types/get-opportunity.use-case.types'
export type {
  GetOpportunityInput,
  GetOpportunityOutput,
} from '../../types/get-opportunity.use-case.types'

import { OpportunityNotFoundError } from '../../domain/errors'
import { assertOpportunityAccess, assertCrmAccess } from '../authorization'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class GetOpportunityUseCase {
  constructor(private readonly opportunityRepository: OpportunityRepository) {}

  async execute(input: GetOpportunityInput): Promise<GetOpportunityOutput> {
    assertCrmAccess(input.actorPapel)
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    assertOpportunityAccess(opportunity, input.actorId, input.actorPapel)

    return opportunity
  }
}
