import type { Papel } from '@server/auth/domain/user.entity'

import { resolveAgendaReadScope } from '../../domain/agenda-access-rules'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface ListAgendaEventsInput {
  actorTenantId: string
  actorUserId: string
  actorPapel: Papel
  from: Date
  to: Date
  responsavelId?: string
}

export class ListAgendaEventsUseCase {
  constructor(private readonly agendaEventRepository: AgendaEventRepository) {}

  async execute(input: ListAgendaEventsInput) {
    return this.agendaEventRepository.list({
      scope: resolveAgendaReadScope(input),
      from: input.from,
      to: input.to,
      responsavelId: input.responsavelId,
    })
  }
}
