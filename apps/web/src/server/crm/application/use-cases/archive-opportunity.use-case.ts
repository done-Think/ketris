import { OpportunityNotFoundError } from '../../domain/errors'
import type { Opportunity } from '../../domain/opportunity.entity'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export interface ArchiveOpportunityInput {
  actorTenantId: string
  opportunityId: string
}

export type ArchiveOpportunityOutput = Opportunity

export class ArchiveOpportunityUseCase {
  constructor(private readonly opportunityRepository: OpportunityRepository) {}

  async execute(input: ArchiveOpportunityInput): Promise<ArchiveOpportunityOutput> {
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    return this.opportunityRepository.archive(opportunity.id)
  }
}
