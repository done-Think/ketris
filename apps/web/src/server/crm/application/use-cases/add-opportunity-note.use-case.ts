import type { ActivityType, OpportunityActivity } from '../../domain/activity.entity'
import { OpportunityNotFoundError } from '../../domain/errors'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export interface AddOpportunityNoteInput {
  actorTenantId: string
  actorId?: string | null
  actorName?: string | null
  opportunityId: string
  description: string
  type?: Extract<ActivityType, 'NOTA' | 'CONTATO_REALIZADO'>
}

export type AddOpportunityNoteOutput = OpportunityActivity

export class AddOpportunityNoteUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(input: AddOpportunityNoteInput): Promise<AddOpportunityNoteOutput> {
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

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
