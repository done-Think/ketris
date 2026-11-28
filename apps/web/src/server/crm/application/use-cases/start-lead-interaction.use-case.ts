import type {
  StartLeadInteractionInput,
  StartLeadInteractionOutput,
} from '../../types/start-lead-interaction.use-case.types'
export type {
  StartLeadInteractionInput,
  StartLeadInteractionOutput,
} from '../../types/start-lead-interaction.use-case.types'

import {
  InteractionChannelUnavailableError,
  InteractionConflictError,
  LeadNotFoundError,
} from '../../domain/errors'
import { assertCrmAccess, assertLeadAccess } from '../authorization'
import type { InteractionRepository } from '../ports/interaction-repository.port'
import type { LeadRepository } from '../ports/lead-repository.port'

export class StartLeadInteractionUseCase {
  constructor(
    private readonly repository: InteractionRepository,
    private readonly leads: LeadRepository,
  ) {}

  async execute(input: StartLeadInteractionInput): Promise<StartLeadInteractionOutput> {
    assertCrmAccess(input.actorRole)
    const lead = await this.leads.findById(input.leadId)
    if (!lead || lead.tenantId !== input.actorTenantId) throw new LeadNotFoundError()
    assertLeadAccess(lead.responsibleId, input.actorId, input.actorRole)
    if (input.channel === 'EMAIL' ? !lead.email : !lead.phone.replace(/\D/g, ''))
      throw new InteractionChannelUnavailableError()
    const existing = await this.repository.findByRequestId(input.requestId)
    if (existing) {
      if (
        existing.leadId !== input.leadId ||
        existing.actorUserId !== input.actorId ||
        existing.channel !== input.channel
      )
        throw new InteractionConflictError()
      return existing
    }
    return this.repository.start(input)
  }
}
