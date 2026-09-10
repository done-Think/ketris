import type { Papel } from '@server/auth/domain/user.entity'

import type { OpportunityActivity } from '../../domain/activity.entity'
import { InvalidStatusTransitionError, OpportunityNotFoundError } from '../../domain/errors'
import type { Opportunity, OpportunityUpdate } from '../../domain/opportunity.entity'
import { canTransition } from '../../domain/opportunity-status'
import { assertAgentOwnsProperty } from '../authorization'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../ports/property-lookup.port'

export interface UpdateOpportunityInput {
  actorTenantId: string
  actorId?: string | null
  actorPapel: Papel
  actorName?: string | null
  opportunityId: string
  changes: OpportunityUpdate
}

export type UpdateOpportunityOutput = Opportunity

export class UpdateOpportunityUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly propertyLookup: PropertyLookupPort,
  ) {}

  async execute(input: UpdateOpportunityInput): Promise<UpdateOpportunityOutput> {
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

    const nextStatus = input.changes.status

    if (nextStatus && !canTransition(current.status, nextStatus)) {
      throw new InvalidStatusTransitionError(current.status, nextStatus)
    }

    const opportunity = await this.opportunityRepository.update(current.id, input.changes)

    if (nextStatus && nextStatus !== current.status) {
      await this.recordStatusChange(current, nextStatus, input)
    }

    return opportunity
  }

  private recordStatusChange(
    current: Opportunity,
    nextStatus: Opportunity['status'],
    input: UpdateOpportunityInput,
  ): Promise<OpportunityActivity> {
    return this.activityRepository.create({
      opportunityId: current.id,
      type: 'MUDANCA_STATUS',
      description: `Status alterado de ${current.status} para ${nextStatus}.`,
      authorId: input.actorId ?? null,
      authorName: input.actorName ?? null,
      previousStatus: current.status,
      newStatus: nextStatus,
    })
  }
}
