import type {
  AddOpportunityNoteInput,
  AddOpportunityNoteOutput,
} from '../../types/add-opportunity-note.use-case.types'
export type {
  AddOpportunityNoteInput,
  AddOpportunityNoteOutput,
} from '../../types/add-opportunity-note.use-case.types'

import { OpportunityNotFoundError } from '../../domain/errors'
import { assertAgentOwnsProperty, assertCrmAccess } from '../authorization'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../ports/property-lookup.port'

export class AddOpportunityNoteUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly propertyLookup: PropertyLookupPort,
  ) {}

  async execute(input: AddOpportunityNoteInput): Promise<AddOpportunityNoteOutput> {
    assertCrmAccess(input.actorPapel)
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    await assertAgentOwnsProperty(
      this.propertyLookup,
      input.actorTenantId,
      opportunity.propertyId,
      input.actorId ?? '',
      input.actorPapel,
    )

    return this.activityRepository.create({
      opportunityId: opportunity.id,
      type: input.type ?? 'NOTA',
      description: input.description.trim(),
      authorId: input.actorId ?? null,
      authorName: input.actorName ?? null,
      previousStatus: null,
      newStatus: null,
    })
  }
}
