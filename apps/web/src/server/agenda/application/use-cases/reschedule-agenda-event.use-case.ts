import type { Papel } from '@server/auth/domain/user.entity'

import { assertCanManageAgenda } from '../../domain/agenda-access-rules'
import { assertWithinAgendaSchedulingWindow } from '../../domain/agenda-scheduling-rules'
import {
  AgendaEventConflictError,
  AgendaEventNotFoundError,
  AgendaVisitMinimumDurationError,
} from '../../domain/errors'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface RescheduleAgendaEventInput {
  actorTenantId: string
  actorPapel: Papel
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

    const durationMinutes =
      input.durationMinutes ?? (existing.fim.getTime() - existing.inicio.getTime()) / 60_000

    if (existing.tipo === 'VISIT' && durationMinutes < 60) {
      throw new AgendaVisitMinimumDurationError()
    }

    if (input.inicio.getTime() !== existing.inicio.getTime()) {
      assertWithinAgendaSchedulingWindow(input.inicio)
    }

    const fim = new Date(input.inicio.getTime() + durationMinutes * 60_000)

    const conflict = await this.agendaEventRepository.hasOverlap(
      input.actorTenantId,
      existing.responsavelId,
      input.inicio,
      fim,
      input.id,
    )

    if (conflict) {
      throw new AgendaEventConflictError()
    }

    const event = await this.agendaEventRepository.reschedule(input.actorTenantId, input.id, {
      inicio: input.inicio,
      fim,
    })

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return event
  }
}
