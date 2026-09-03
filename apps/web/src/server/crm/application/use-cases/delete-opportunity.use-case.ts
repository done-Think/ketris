import { OpportunityNotFoundError } from '../../domain/errors'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export interface DeleteOpportunityInput {
  actorTenantId: string
  opportunityId: string
}

export class DeleteOpportunityUseCase {
  constructor(private readonly opportunityRepository: OpportunityRepository) {}

  async execute(input: DeleteOpportunityInput): Promise<void> {
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    await this.opportunityRepository.delete(opportunity.id)
  }
}
