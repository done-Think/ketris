import { ForbiddenError } from '@server/shared/errors'
import type {
  CreateOpportunityInput,
  CreateOpportunityOutput,
} from '../../types/create-opportunity.use-case.types'
export type {
  CreateOpportunityInput,
  CreateOpportunityOutput,
} from '../../types/create-opportunity.use-case.types'

import { ContactNotFoundError, OpportunityPropertyNotFoundError } from '../../domain/errors'
import { assertCrmAccess } from '../authorization'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { ContactRepository } from '../ports/contact-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../ports/property-lookup.port'

export class CreateOpportunityUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly contactRepository: ContactRepository,
    private readonly propertyLookup: PropertyLookupPort,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(input: CreateOpportunityInput): Promise<CreateOpportunityOutput> {
    assertCrmAccess(input.actorPapel)
    const ownsProperty = await this.propertyLookup.existsForTenant(
      input.actorTenantId,
      input.propertyId,
    )

    if (!ownsProperty) throw new OpportunityPropertyNotFoundError()

    if (input.actorPapel === 'AGENT') {
      const responsavelId = await this.propertyLookup.findResponsavelId(
        input.actorTenantId,
        input.propertyId,
      )

      if (responsavelId !== input.actorId) {
        throw new ForbiddenError('Você só pode criar oportunidades para os próprios imóveis.')
      }
    }

    let contactDetails = {}
    if (input.contactId) {
      const contact = await this.contactRepository.findById(input.contactId)

      if (!contact || contact.tenantId !== input.actorTenantId) {
        throw new ContactNotFoundError()
      }
      contactDetails = {
        leadName: contact.name,
        leadEmail: contact.email,
        leadPhone: contact.phone,
      }
    }

    const opportunity = await this.opportunityRepository.create({
      tenantId: input.actorTenantId,
      propertyId: input.propertyId,
      contactId: input.contactId ?? null,
      leadName: input.leadName,
      leadEmail: input.leadEmail,
      leadPhone: input.leadPhone ?? null,
      proposedValue: input.proposedValue,
      notes: input.notes ?? null,
      status: input.status ?? 'RASCUNHO',
      contractTermMonths: input.contractTermMonths,
      desiredStartDate: input.desiredStartDate,
      guaranteeType: input.guaranteeType,
      specialConditions: input.specialConditions,
      ...contactDetails,
    })

    await this.activityRepository.create({
      opportunityId: opportunity.id,
      type: 'NOTA',
      description: '',
      systemAction: 'OPPORTUNITY_CREATED',
      authorId: input.actorId ?? null,
      authorName: input.actorName ?? null,
      previousStatus: null,
      newStatus: null,
    })

    return opportunity
  }
}
