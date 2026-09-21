import type { Papel } from '@server/auth/domain/user.entity'

import type { Lead, LeadUpdate } from '../../domain/lead.entity'
import { LeadNotFoundError } from '../../domain/errors'
import { assertLeadAccess } from '../authorization'
import type { LeadRepository } from '../ports/lead-repository.port'

export interface UpdateLeadInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  leadId: string
  changes: LeadUpdate
}

export type UpdateLeadOutput = Lead

export class UpdateLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(input: UpdateLeadInput): Promise<UpdateLeadOutput> {
    const lead = await this.leadRepository.findById(input.leadId)

    if (!lead || lead.tenantId !== input.actorTenantId) {
      throw new LeadNotFoundError()
    }

    assertLeadAccess(lead.responsavelId, input.actorId, input.actorPapel)

    return this.leadRepository.update(lead.id, input.changes)
  }
}
