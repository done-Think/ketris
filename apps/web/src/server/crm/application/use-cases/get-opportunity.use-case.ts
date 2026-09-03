import { OpportunityNotFoundError } from '../../domain/errors'
import type { Opportunity } from '../../domain/opportunity.entity'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export interface GetOpportunityInput {
  actorTenantId: string
  opportunityId: string
}

export type GetOpportunityOutput = Opportunity

export class GetOpportunityUseCase {
  constructor(private readonly opportunityRepository: OpportunityRepository) {}

  async execute(input: GetOpportunityInput): Promise<GetOpportunityOutput> {
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    return opportunity
  }
}
