import type { Papel } from '@server/auth/domain/user.entity'

import { resolveAgendaReadScope } from '../../domain/agenda-access-rules'
import { AgendaEventNotFoundError } from '../../domain/errors'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface GetAgendaEventInput {
  actorTenantId: string
  actorUserId: string
  actorPapel: Papel
  id: string
}

export class GetAgendaEventUseCase {
  constructor(private readonly agendaEventRepository: AgendaEventRepository) {}

  async execute(input: GetAgendaEventInput) {
    // Events outside the actor's read scope (another tenant, or no explicit link for a RENTER)
    // answer 404 just like nonexistent ids, so ids can't be enumerated.
    const event = await this.agendaEventRepository.findByScopeAndId(
      resolveAgendaReadScope(input),
      input.id,
    )

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return event
  }
}
