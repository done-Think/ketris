import type { Papel } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

import { LeadAlreadyConvertedError, LeadNotFoundError } from '../../domain/errors'
import type { Lead } from '../../domain/lead.entity'
import type { Opportunity } from '../../domain/opportunity.entity'
import { OpportunityPropertyNotFoundError } from '../../domain/errors'
import { assertLeadAccess } from '../authorization'
import type { LeadRepository } from '../ports/lead-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../ports/property-lookup.port'

export interface ConvertLeadToOpportunityInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  leadId: string
  propertyId: string
  proposedValue: number
}

export interface ConvertLeadToOpportunityOutput {
  lead: Lead
  opportunity: Opportunity
}

/**
 * Turns a Lead (raw, unqualified contact) into a formal Opportunity once the broker has settled on
 * a specific property and a proposed value — the two things a Lead deliberately doesn't carry yet.
 * The Lead survives, marked PROPOSTA and linked to the new Opportunity, so its history isn't lost.
 */
export class ConvertLeadToOpportunityUseCase {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly opportunityRepository: OpportunityRepository,
    private readonly propertyLookup: PropertyLookupPort,
  ) {}

  async execute(input: ConvertLeadToOpportunityInput): Promise<ConvertLeadToOpportunityOutput> {
    const lead = await this.leadRepository.findById(input.leadId)

    if (!lead || lead.tenantId !== input.actorTenantId) {
      throw new LeadNotFoundError()
    }

    assertLeadAccess(lead.responsavelId, input.actorId, input.actorPapel)

    if (lead.opportunityId) {
      throw new LeadAlreadyConvertedError()
    }

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

    const opportunity = await this.opportunityRepository.create({
      tenantId: input.actorTenantId,
      propertyId: input.propertyId,
      leadName: lead.name,
      leadEmail: lead.email ?? '',
      leadPhone: lead.phone,
      proposedValue: input.proposedValue,
      notes: lead.notes,
      status: 'RASCUNHO',
    })

    const convertedLead = await this.leadRepository.markConverted(lead.id, opportunity.id)

    return { lead: convertedLead, opportunity }
  }
}
