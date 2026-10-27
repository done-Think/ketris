import type {
  RespondToOpportunityInput,
  RespondToOpportunityOutput,
} from '../../types/respond-to-opportunity.use-case.types'
export type {
  RespondToOpportunityInput,
  RespondToOpportunityOutput,
} from '../../types/respond-to-opportunity.use-case.types'

import { OpportunityNotAnswerableError, OpportunityNotFoundError } from '../../domain/errors'
import { canRespond, statusForResponse } from '../../domain/opportunity-status'
import { assertOpportunityAccess, assertCrmAccess } from '../authorization'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class RespondToOpportunityUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(input: RespondToOpportunityInput): Promise<RespondToOpportunityOutput> {
    assertCrmAccess(input.actorPapel)
    const current = await this.opportunityRepository.findById(input.opportunityId)

    if (!current || current.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    assertOpportunityAccess(current, input.actorId ?? '', input.actorPapel)

    if (!canRespond(current.status)) {
      throw new OpportunityNotAnswerableError(current.status)
    }

    const nextStatus = statusForResponse(input.action)
    const opportunity = await this.opportunityRepository.update(current.id, {
      status: nextStatus,
    })

    const message = input.message?.trim()
    const activity = await this.activityRepository.create({
      opportunityId: current.id,
      type: 'PROPOSTA_RESPONDIDA',
      description: message ?? '',
      systemAction: input.action,
      authorId: input.actorId ?? null,
      authorName: input.actorName ?? null,
      previousStatus: current.status,
      newStatus: nextStatus,
    })

    return { opportunity, activity }
  }
}
