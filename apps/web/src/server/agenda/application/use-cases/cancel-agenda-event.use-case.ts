import type { Papel } from '@server/auth/domain/user.entity'

import { assertCanManageAgenda, assertCanManageAgendaEvent } from '../../domain/agenda-access-rules'
import { AgendaEventNotFoundError } from '../../domain/errors'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface CancelAgendaEventInput {
  actorTenantId: string
  actorPapel: Papel
  actorUserId?: string
  id: string
}

export class CancelAgendaEventUseCase {
  constructor(private readonly agendaEventRepository: AgendaEventRepository) {}

  async execute(input: CancelAgendaEventInput) {
    assertCanManageAgenda(input.actorPapel)
    const existing = await this.agendaEventRepository.findByTenantAndId(
      input.actorTenantId,
      input.id,
    )
    if (!existing) throw new AgendaEventNotFoundError()
    assertCanManageAgendaEvent(input.actorPapel, input.actorUserId, existing)

    const event = await this.agendaEventRepository.cancel(input.actorTenantId, input.id)

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return event
  }
}
