import type { Papel } from '@server/auth/domain/user.entity'

import { assertCanManageAgendaEvent } from '../../domain/agenda-access-rules'
import {
  findManageableAgendaEvent,
  manageableAgendaEventTenantId,
} from '../find-manageable-agenda-event'
import { validateAgendaSchedule } from '../validate-agenda-schedule'
import { AgendaEventNotFoundError } from '../../domain/errors'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface RescheduleAgendaEventInput {
  outsideBusinessHoursConfirmed?: boolean
  actorTenantId: string
  actorPapel: Papel
  actorUserId?: string
  id: string
  inicio: Date
  durationMinutes?: number
}

export class RescheduleAgendaEventUseCase {
  constructor(private readonly agendaEventRepository: AgendaEventRepository) {}

  async execute(input: RescheduleAgendaEventInput) {
    const existing = await findManageableAgendaEvent(this.agendaEventRepository, input, input.id)

    if (!existing) {
      throw new AgendaEventNotFoundError()
    }
    assertCanManageAgendaEvent(input.actorPapel, input.actorUserId, existing)

    const schedule = await validateAgendaSchedule(this.agendaEventRepository, existing, input)

    const event = await this.agendaEventRepository.reschedule(
      manageableAgendaEventTenantId(input, existing),
      input.id,
      schedule,
    )

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return event
  }
}
