import type { Papel } from '@server/auth/domain/user.entity'

import { assertCanManageAgendaEvent } from '../../domain/agenda-access-rules'
import {
  findManageableAgendaEvent,
  manageableAgendaEventTenantId,
} from '../find-manageable-agenda-event'
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
    const existing = await findManageableAgendaEvent(this.agendaEventRepository, input, input.id)
    if (!existing) throw new AgendaEventNotFoundError()
    assertCanManageAgendaEvent(input.actorPapel, input.actorUserId, existing)

    const event = await this.agendaEventRepository.cancel(
      manageableAgendaEventTenantId(input, existing),
      input.id,
    )

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return event
  }
}
