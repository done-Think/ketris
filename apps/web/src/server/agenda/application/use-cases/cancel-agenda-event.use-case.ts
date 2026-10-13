import type { Papel } from '@server/auth/domain/user.entity'

import { assertCanAccessAgenda } from '../../domain/agenda-access-rules'
import { AgendaEventNotFoundError } from '../../domain/errors'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface CancelAgendaEventInput {
  actorTenantId: string
  actorPapel: Papel
  id: string
}

export class CancelAgendaEventUseCase {
  constructor(private readonly agendaEventRepository: AgendaEventRepository) {}

  async execute(input: CancelAgendaEventInput) {
    assertCanAccessAgenda(input.actorPapel)

    const event = await this.agendaEventRepository.cancel(input.actorTenantId, input.id)

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return event
  }
}
