import type { Papel } from '@server/auth/domain/user.entity'

import { assertCanAccessAgenda } from '../../domain/agenda-access-rules'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface ListAgendaEventsInput {
  actorTenantId: string
  actorPapel: Papel
  from: Date
  to: Date
  responsavelId?: string
}

export class ListAgendaEventsUseCase {
  constructor(private readonly agendaEventRepository: AgendaEventRepository) {}

  async execute(input: ListAgendaEventsInput) {
    assertCanAccessAgenda(input.actorPapel)

    return this.agendaEventRepository.list({
      tenantId: input.actorTenantId,
      from: input.from,
      to: input.to,
      responsavelId: input.responsavelId,
    })
  }
}
