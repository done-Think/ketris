import {
  prepareAgendaPropertySummary,
  withPreparedAgendaPropertySummary,
} from '../with-agenda-property-summaries'
import type { AgendaPropertyCatalog } from '../ports/agenda-property-catalog.port'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'
import type { RecordAgendaEventOutcomeInput } from '../../types/use-case-inputs'

import {
  findManageableAgendaEvent,
  manageableAgendaEventTenantId,
} from '../find-manageable-agenda-event'
import {
  assertAgendaOutcomeAllowed,
  assertCanRecordAgendaOutcome,
} from '../../domain/agenda-outcome-rules'
import { AgendaEventNotFoundError } from '../../domain/errors'

export class RecordAgendaEventOutcomeUseCase {
  constructor(
    private readonly agendaEventRepository: AgendaEventRepository,
    private readonly propertyCatalog?: AgendaPropertyCatalog,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: RecordAgendaEventOutcomeInput) {
    const existing = await findManageableAgendaEvent(this.agendaEventRepository, input, input.id)
    if (!existing) throw new AgendaEventNotFoundError()

    assertCanRecordAgendaOutcome(input.actorRole, input.actorUserId, existing)
    assertAgendaOutcomeAllowed(existing, input.outcome, input.visitInterest, this.now())

    const propertySummary = await prepareAgendaPropertySummary(
      this.propertyCatalog,
      input,
      existing.propertyId,
    )

    const event = await this.agendaEventRepository.recordOutcome(
      manageableAgendaEventTenantId(input, existing),
      input.id,
      {
        outcome: input.outcome,
        expectedStatus: existing.status,
        visitInterest: input.visitInterest ?? null,
        notes: input.notes?.trim() || null,
        actorUserId: input.actorUserId,
      },
    )

    if (!event) throw new AgendaEventNotFoundError()

    return withPreparedAgendaPropertySummary(event, propertySummary)
  }
}
