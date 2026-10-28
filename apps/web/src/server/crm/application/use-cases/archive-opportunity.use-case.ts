import type {
  ArchiveOpportunityInput,
  ArchiveOpportunityOutput,
} from '../../types/archive-opportunity.use-case.types'
export type {
  ArchiveOpportunityInput,
  ArchiveOpportunityOutput,
} from '../../types/archive-opportunity.use-case.types'

import { OpportunityNotFoundError } from '../../domain/errors'
import { assertOpportunityAccess, assertCrmAccess } from '../authorization'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class ArchiveOpportunityUseCase {
  constructor(private readonly opportunityRepository: OpportunityRepository) {}

  async execute(input: ArchiveOpportunityInput): Promise<ArchiveOpportunityOutput> {
    assertCrmAccess(input.actorRole)
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    assertOpportunityAccess(opportunity, input.actorId, input.actorRole)

    return this.opportunityRepository.archive(opportunity.id)
  }
}
