import { withAgendaPropertySummaries } from '../with-agenda-property-summaries'
import type { AgendaPropertyCatalog } from '../ports/agenda-property-catalog.port'
import type { ListAgendaEventsInput } from '../../types/use-case-inputs'

import { resolveAgendaReadScope } from '../../domain/agenda-access-rules'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export class ListAgendaEventsUseCase {
  constructor(
    private readonly agendaEventRepository: AgendaEventRepository,
    private readonly propertyCatalog?: AgendaPropertyCatalog,
  ) {}

  async execute(input: ListAgendaEventsInput) {
    const events = await this.agendaEventRepository.list({
      scope: resolveAgendaReadScope(input),
      from: input.from,
      to: input.to,
      responsibleId: input.responsibleId,
    })
    return withAgendaPropertySummaries(this.propertyCatalog, input, events)
  }
}
