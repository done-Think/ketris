import type { GetLeadInput, GetLeadOutput } from '../../types/get-lead.use-case.types'
export type { GetLeadInput, GetLeadOutput } from '../../types/get-lead.use-case.types'

import { LeadNotFoundError } from '../../domain/errors'
import { assertCrmAccess, assertLeadAccess } from '../authorization'
import type { LeadRepository } from '../ports/lead-repository.port'

export class GetLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(input: GetLeadInput): Promise<GetLeadOutput> {
    assertCrmAccess(input.actorRole)
    const lead = await this.leadRepository.findById(input.leadId)

    if (!lead || lead.tenantId !== input.actorTenantId) {
      throw new LeadNotFoundError()
    }

    assertLeadAccess(lead.responsibleId, input.actorId, input.actorRole)

    return lead
  }
}
