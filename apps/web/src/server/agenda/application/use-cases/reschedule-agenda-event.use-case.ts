import type { Papel } from '@server/auth/domain/user.entity'

import { assertCanManageAgenda, assertCanManageAgendaEvent } from '../../domain/agenda-access-rules'
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
    assertCanManageAgenda(input.actorPapel)

    const existing = await this.agendaEventRepository.findByTenantAndId(
      input.actorTenantId,
      input.id,
    )

    if (!existing) {
      throw new AgendaEventNotFoundError()
    }
    assertCanManageAgendaEvent(input.actorPapel, input.actorUserId, existing)

    const schedule = await validateAgendaSchedule(this.agendaEventRepository, existing, input)

    const event = await this.agendaEventRepository.reschedule(
      input.actorTenantId,
      input.id,
      schedule,
    )

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return event
  }
}
