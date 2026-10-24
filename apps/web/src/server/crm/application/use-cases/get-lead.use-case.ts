import type { Papel } from '@server/auth/domain/user.entity'

import type { Lead } from '../../domain/lead.entity'
import { LeadNotFoundError } from '../../domain/errors'
import { assertLeadAccess, assertCrmAccess } from '../authorization'
import type { LeadRepository } from '../ports/lead-repository.port'

export interface GetLeadInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  leadId: string
}

export type GetLeadOutput = Lead

export class GetLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(input: GetLeadInput): Promise<GetLeadOutput> {
    assertCrmAccess(input.actorPapel)
    const lead = await this.leadRepository.findById(input.leadId)

    if (!lead || lead.tenantId !== input.actorTenantId) {
      throw new LeadNotFoundError()
    }

    assertLeadAccess(lead.responsavelId, input.actorId, input.actorPapel)

    return lead
  }
}
