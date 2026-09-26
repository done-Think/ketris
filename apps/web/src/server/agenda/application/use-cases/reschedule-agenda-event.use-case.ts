import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

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
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar a agenda.')
    }

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
