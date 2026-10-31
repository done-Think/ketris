import type { CreateLeadInput, CreateLeadOutput } from '../../types/create-lead.use-case.types'
export type { CreateLeadInput, CreateLeadOutput } from '../../types/create-lead.use-case.types'

import { assertCrmAccess } from '../authorization'
import type { LeadRepository } from '../ports/lead-repository.port'
import type { LeadPropertyLookupPort } from '../ports/lead-property-lookup.port'
import { OpportunityPropertyNotFoundError } from '../../domain/errors'

export class CreateLeadUseCase {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly propertyLookup: LeadPropertyLookupPort,
  ) {}

  async execute(input: CreateLeadInput): Promise<CreateLeadOutput> {
    assertCrmAccess(input.actorRole)
    const property = input.propertyId
      ? await this.propertyLookup.findAvailable(
          input.actorTenantId,
          input.propertyId,
          input.actorRole === 'AGENT' ? input.actorId : undefined,
        )
      : null
    if (input.propertyId && !property) throw new OpportunityPropertyNotFoundError()
    return this.leadRepository.create({
      tenantId: input.actorTenantId,
      responsibleId: property?.responsibleId ?? input.actorId,
      propertyId: property?.id ?? null,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      interest: property?.title ?? input.interest,
      budget: input.budget,
      source: input.source,
      notes: input.notes ?? null,
    })
  }
}
