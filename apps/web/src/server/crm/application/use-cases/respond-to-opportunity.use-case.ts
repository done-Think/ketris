import type { OpportunityActivity } from '../../domain/activity.entity'
import { OpportunityNotAnswerableError, OpportunityNotFoundError } from '../../domain/errors'
import type { Opportunity } from '../../domain/opportunity.entity'
import {
  canRespond,
  statusForResponse,
  type OpportunityResponseAction,
} from '../../domain/opportunity-status'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export interface RespondToOpportunityInput {
  actorTenantId: string
  actorId?: string | null
  actorName?: string | null
  opportunityId: string
  action: OpportunityResponseAction
  /** Rejection reason or what's being asked of the lead. Becomes the timeline note. */
  message?: string | null
}

export interface RespondToOpportunityOutput {
  opportunity: Opportunity
  activity: OpportunityActivity
}

const defaultDescription: Record<OpportunityResponseAction, string> = {
  ACEITAR: 'Proposta aceita.',
  RECUSAR: 'Proposta recusada.',
  SOLICITAR_INFORMACOES: 'Solicitadas mais informações ao interessado.',
}

/**
 * The broker's response to a proposal: accept, reject, or ask for more information.
 *
 * Kept separate from the generic update because it carries a rule the PATCH doesn't: it validates
 * the opportunity is in an answerable state and records the decision on the timeline. Without this
 * there's no trail of who accepted what — and an accepted proposal spawns a Contract (FR-014).
 */
export class RespondToOpportunityUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(input: RespondToOpportunityInput): Promise<RespondToOpportunityOutput> {
    const current = await this.opportunityRepository.findById(input.opportunityId)

    if (!current || current.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

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
      description: message || defaultDescription[input.action],
      authorId: input.actorId ?? null,
      authorName: input.actorName ?? null,
      previousStatus: current.status,
      newStatus: nextStatus,
    })

    return { opportunity, activity }
  }
}
