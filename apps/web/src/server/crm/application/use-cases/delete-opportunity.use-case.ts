import type { DeleteOpportunityInput } from '../../types/delete-opportunity.use-case.types'
export type { DeleteOpportunityInput } from '../../types/delete-opportunity.use-case.types'

import { OpportunityNotFoundError } from '../../domain/errors'
import { assertOpportunityAccess, assertCrmAccess } from '../authorization'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class DeleteOpportunityUseCase {
  constructor(private readonly opportunityRepository: OpportunityRepository) {}

  async execute(input: DeleteOpportunityInput): Promise<void> {
    assertCrmAccess(input.actorPapel)
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    assertOpportunityAccess(opportunity, input.actorId, input.actorPapel)

    await this.opportunityRepository.delete(opportunity.id)
  }
}
