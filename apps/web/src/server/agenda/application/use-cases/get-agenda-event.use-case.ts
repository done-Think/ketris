import { withAgendaPropertySummary } from '../with-agenda-property-summaries'
import type { AgendaPropertyCatalog } from '../ports/agenda-property-catalog.port'
import type { GetAgendaEventInput } from '../../types/use-case-inputs'

import { resolveAgendaReadScope } from '../../domain/agenda-access-rules'
import { AgendaEventNotFoundError } from '../../domain/errors'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export class GetAgendaEventUseCase {
  constructor(
    private readonly agendaEventRepository: AgendaEventRepository,
    private readonly propertyCatalog?: AgendaPropertyCatalog,
  ) {}

  async execute(input: GetAgendaEventInput) {
    const event = await this.agendaEventRepository.findByScopeAndId(
      resolveAgendaReadScope(input),
      input.id,
    )

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return withAgendaPropertySummary(this.propertyCatalog, input, event)
  }
}
