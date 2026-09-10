import type { Papel } from '@server/auth/domain/user.entity'

import { OpportunityNotFoundError } from '../../domain/errors'
import { assertAgentOwnsProperty } from '../authorization'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../ports/property-lookup.port'

export interface DeleteOpportunityInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  opportunityId: string
}

export class DeleteOpportunityUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly propertyLookup: PropertyLookupPort,
  ) {}

  async execute(input: DeleteOpportunityInput): Promise<void> {
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    await assertAgentOwnsProperty(
      this.propertyLookup,
      input.actorTenantId,
      opportunity.propertyId,
      input.actorId,
      input.actorPapel,
    )

    await this.opportunityRepository.delete(opportunity.id)
  }
}
