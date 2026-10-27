import type {
  UpdateOpportunityInput,
  UpdateOpportunityOutput,
} from '../../types/update-opportunity.use-case.types'
export type {
  UpdateOpportunityInput,
  UpdateOpportunityOutput,
} from '../../types/update-opportunity.use-case.types'

import type { OpportunityActivity } from '../../domain/activity.entity'
import {
  ContactEmailAlreadyExistsError,
  ContactNotFoundError,
  InvalidStatusTransitionError,
  OpportunityNotFoundError,
} from '../../domain/errors'
import { canTransition } from '../../domain/opportunity-status'
import type { Opportunity } from '../../domain/opportunity.entity'
import { assertOpportunityAccess, assertCrmAccess } from '../authorization'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { ContactRepository } from '../ports/contact-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class UpdateOpportunityUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly contactRepository: ContactRepository,
  ) {}

  async execute(input: UpdateOpportunityInput): Promise<UpdateOpportunityOutput> {
    assertCrmAccess(input.actorPapel)
    const current = await this.opportunityRepository.findById(input.opportunityId)

    if (!current || current.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    assertOpportunityAccess(current, input.actorId ?? '', input.actorPapel)

    const nextStatus = input.changes.status

    if (nextStatus && !canTransition(current.status, nextStatus)) {
      throw new InvalidStatusTransitionError(current.status, nextStatus)
    }

    const changes = { ...input.changes }
    const contactId = changes.contactId === undefined ? current.contactId : changes.contactId
    if (contactId) {
      const contact = await this.contactRepository.findById(contactId)
      if (!contact || contact.tenantId !== input.actorTenantId) throw new ContactNotFoundError()
      if (
        changes.leadName !== undefined ||
        changes.leadEmail !== undefined ||
        changes.leadPhone !== undefined
      ) {
        const email = changes.leadEmail?.trim().toLowerCase() ?? contact.email
        const duplicate =
          email !== contact.email
            ? await this.contactRepository.findByEmail(input.actorTenantId, email)
            : null
        if (duplicate && duplicate.id !== contact.id) throw new ContactEmailAlreadyExistsError()
        const updated = await this.contactRepository.update(contact.id, {
          name: changes.leadName ?? contact.name,
          email,
          phone: changes.leadPhone === undefined ? contact.phone : changes.leadPhone,
        })
        await this.opportunityRepository.syncContactDetails(
          input.actorTenantId,
          contact.id,
          updated,
        )
        changes.leadName = updated.name
        changes.leadEmail = updated.email
        changes.leadPhone = updated.phone
      } else {
        changes.leadName = contact.name
        changes.leadEmail = contact.email
        changes.leadPhone = contact.phone
      }
    }

    const opportunity = await this.opportunityRepository.update(current.id, changes)

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
      description: '',
      systemAction: 'STATUS_CHANGED',
      authorId: input.actorId ?? null,
      authorName: input.actorName ?? null,
      previousStatus: current.status,
      newStatus: nextStatus,
    })
  }
}
