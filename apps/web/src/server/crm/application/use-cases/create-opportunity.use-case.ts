import { ContactNotFoundError, OpportunityPropertyNotFoundError } from '../../domain/errors'
import type { Opportunity } from '../../domain/opportunity.entity'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { ContactRepository } from '../ports/contact-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../ports/property-lookup.port'

export interface CreateOpportunityInput {
  actorTenantId: string
  actorId?: string | null
  actorName?: string | null
  propertyId: string
  contactId?: string | null
  leadName: string
  leadEmail: string
  leadPhone?: string | null
  proposedValue: number
  notes?: string | null
  status?: 'RASCUNHO' | 'ENVIADA'
}

export type CreateOpportunityOutput = Opportunity

/**
 * Manual opportunity creation by the broker — e.g. a lead received by phone/WhatsApp, outside the
 * marketplace's public form (that other path is `SubmitInquiryUseCase`, in
 * `src/server/marketplace/`, unauthenticated and with no tenant known a priori).
 *
 * Two ownership checks are mandatory, not just for form's sake: `propertyId` and `contactId` (when
 * given) must belong to the actor's tenant — without this an authenticated actor could attach an
 * opportunity to a property or contact from ANOTHER tenant, breaking multi-tenant isolation.
 */
export class CreateOpportunityUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly contactRepository: ContactRepository,
    private readonly propertyLookup: PropertyLookupPort,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(input: CreateOpportunityInput): Promise<CreateOpportunityOutput> {
    const ownsProperty = await this.propertyLookup.existsForTenant(
      input.actorTenantId,
      input.propertyId,
    )

    if (!ownsProperty) throw new OpportunityPropertyNotFoundError()

    if (input.contactId) {
      const contact = await this.contactRepository.findById(input.contactId)

      if (!contact || contact.tenantId !== input.actorTenantId) {
        throw new ContactNotFoundError()
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
    })

    await this.activityRepository.create({
      opportunityId: opportunity.id,
      type: 'NOTA',
      description: 'Oportunidade criada manualmente.',
      authorId: input.actorId ?? null,
      authorName: input.actorName ?? null,
      previousStatus: null,
      newStatus: null,
    })

    return opportunity
  }
}
