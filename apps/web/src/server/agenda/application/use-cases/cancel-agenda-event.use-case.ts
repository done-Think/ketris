import {
  prepareAgendaPropertySummary,
  withPreparedAgendaPropertySummary,
} from '../with-agenda-property-summaries'
import type { AgendaPropertyCatalog } from '../ports/agenda-property-catalog.port'
import type { CancelAgendaEventInput } from '../../types/use-case-inputs'

import { assertCanManageAgendaEvent } from '../../domain/agenda-access-rules'
import {
  findManageableAgendaEvent,
  manageableAgendaEventTenantId,
} from '../find-manageable-agenda-event'
import {
  AgendaEventNotFoundError,
  AgendaCancellationReasonRequiredError,
} from '../../domain/errors'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export class CancelAgendaEventUseCase {
  constructor(
    private readonly agendaEventRepository: AgendaEventRepository,
    private readonly propertyCatalog?: AgendaPropertyCatalog,
  ) {}

  async execute(input: CancelAgendaEventInput) {
    const existing = await findManageableAgendaEvent(this.agendaEventRepository, input, input.id)
    if (!existing) throw new AgendaEventNotFoundError()
    assertCanManageAgendaEvent(input.actorPapel, input.actorUserId, existing)

    if (!input.reason?.trim()) throw new AgendaCancellationReasonRequiredError()

    const propertySummary = await prepareAgendaPropertySummary(
      this.propertyCatalog,
      input,
      existing.imovelId,
    )

    const event = await this.agendaEventRepository.cancel(
      manageableAgendaEventTenantId(input, existing),
      input.id,
      { reason: input.reason.trim(), actorUserId: input.actorUserId },
    )

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return withPreparedAgendaPropertySummary(event, propertySummary)
  }
}
