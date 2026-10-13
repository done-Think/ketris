import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface ListAgendaEventsInput {
  actorTenantId: string
  from: Date
  to: Date
  responsavelId?: string
}

export class ListAgendaEventsUseCase {
  constructor(private readonly agendaEventRepository: AgendaEventRepository) {}

  execute(input: ListAgendaEventsInput) {
    return this.agendaEventRepository.list({
      tenantId: input.actorTenantId,
      from: input.from,
      to: input.to,
      responsavelId: input.responsavelId,
    })
  }
}
