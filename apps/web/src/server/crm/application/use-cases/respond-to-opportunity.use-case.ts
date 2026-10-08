import type { Papel } from '@server/auth/domain/user.entity'

import type { OpportunityActivity } from '../../domain/activity.entity'
import { OpportunityNotAnswerableError, OpportunityNotFoundError } from '../../domain/errors'
import type { Opportunity } from '../../domain/opportunity.entity'
import {
  canRespond,
  statusForResponse,
  type OpportunityResponseAction,
} from '../../domain/opportunity-status'
import { assertAgentOwnsProperty } from '../authorization'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../ports/property-lookup.port'

export interface RespondToOpportunityInput {
  actorTenantId: string
  actorId?: string | null
  actorPapel: Papel
  actorName?: string | null
  opportunityId: string
  action: OpportunityResponseAction
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

export class RespondToOpportunityUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly propertyLookup: PropertyLookupPort,
  ) {}

  async execute(input: RespondToOpportunityInput): Promise<RespondToOpportunityOutput> {
    const current = await this.opportunityRepository.findById(input.opportunityId)

    if (!current || current.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    await assertAgentOwnsProperty(
      this.propertyLookup,
      input.actorTenantId,
      current.propertyId,
      input.actorId ?? '',
      input.actorPapel,
    )

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
