import {
  prepareAgendaPropertySummary,
  withPreparedAgendaPropertySummary,
} from '../with-agenda-property-summaries'
import type { AgendaPropertyCatalog } from '../ports/agenda-property-catalog.port'
import type { RescheduleAgendaEventInput } from '../../types/use-case-inputs'

import { assertCanManageAgendaEvent } from '../../domain/agenda-access-rules'
import {
  findManageableAgendaEvent,
  manageableAgendaEventTenantId,
} from '../find-manageable-agenda-event'
import { validateAgendaSchedule } from '../validate-agenda-schedule'
import { AgendaEventNotFoundError } from '../../domain/errors'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export class RescheduleAgendaEventUseCase {
  constructor(
    private readonly agendaEventRepository: AgendaEventRepository,
    private readonly propertyCatalog?: AgendaPropertyCatalog,
  ) {}

  async execute(input: RescheduleAgendaEventInput) {
    const existing = await findManageableAgendaEvent(this.agendaEventRepository, input, input.id)

    if (!existing) {
      throw new AgendaEventNotFoundError()
    }
    assertCanManageAgendaEvent(input.actorPapel, input.actorUserId, existing)

    const schedule = await validateAgendaSchedule(this.agendaEventRepository, existing, input)

    const propertySummary = await prepareAgendaPropertySummary(
      this.propertyCatalog,
      input,
      existing.imovelId,
    )

    const event = await this.agendaEventRepository.reschedule(
      manageableAgendaEventTenantId(input, existing),
      input.id,
      schedule,
      input.actorUserId,
    )

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return withPreparedAgendaPropertySummary(event, propertySummary)
  }
}
