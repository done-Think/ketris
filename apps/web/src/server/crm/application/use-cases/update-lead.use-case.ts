import type { UpdateLeadInput, UpdateLeadOutput } from '../../types/update-lead.use-case.types'
export type { UpdateLeadInput, UpdateLeadOutput } from '../../types/update-lead.use-case.types'

import { LeadNotFoundError, LeadStageLockedError } from '../../domain/errors'
import { assertCrmAccess, assertLeadAccess } from '../authorization'
import type { LeadRepository } from '../ports/lead-repository.port'

export class UpdateLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(input: UpdateLeadInput): Promise<UpdateLeadOutput> {
    assertCrmAccess(input.actorPapel)
    const lead = await this.leadRepository.findById(input.leadId)

    if (!lead || lead.tenantId !== input.actorTenantId) {
      throw new LeadNotFoundError()
    }

    assertLeadAccess(lead.responsavelId, input.actorId, input.actorPapel)

    if (lead.opportunityId && input.changes.stage && input.changes.stage !== 'PROPOSTA')
      throw new LeadStageLockedError()

    return this.leadRepository.update(lead.id, input.changes)
  }
}
