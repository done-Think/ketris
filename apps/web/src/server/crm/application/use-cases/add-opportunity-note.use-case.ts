import type {
  AddOpportunityNoteInput,
  AddOpportunityNoteOutput,
} from '../../types/add-opportunity-note.use-case.types'
export type {
  AddOpportunityNoteInput,
  AddOpportunityNoteOutput,
} from '../../types/add-opportunity-note.use-case.types'

import { OpportunityNotFoundError } from '../../domain/errors'
import { assertOpportunityAccess, assertCrmAccess } from '../authorization'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class AddOpportunityNoteUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(input: AddOpportunityNoteInput): Promise<AddOpportunityNoteOutput> {
    assertCrmAccess(input.actorRole)
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    assertOpportunityAccess(opportunity, input.actorId ?? '', input.actorRole)

    return this.activityRepository.create({
      opportunityId: opportunity.id,
      type: input.type ?? 'NOTE',
      description: input.description.trim(),
      authorId: input.actorId ?? null,
      authorName: input.actorName ?? null,
      previousStatus: null,
      newStatus: null,
    })
  }
}
