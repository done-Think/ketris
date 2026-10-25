import type { AgendaScheduleChanges } from '../types/scheduling'
import type { AgendaEventRepository } from './ports/agenda-event-repository.port'
import type { AgendaEvent } from '../domain/agenda-event.entity'

import { assertWithinAgendaSchedulingWindow } from '../domain/agenda-scheduling-rules'
import { AgendaEventConflictError, AgendaVisitMinimumDurationError } from '../domain/errors'
import { AGENDA_MINIMUM_VISIT_MINUTES } from '@shared/lib/utils/agenda-scheduling'

export async function validateAgendaSchedule(
  repository: AgendaEventRepository,
  existing: AgendaEvent,
  changes: AgendaScheduleChanges,
) {
  const inicio = changes.inicio ?? existing.inicio
  const durationMinutes =
    changes.durationMinutes ?? (existing.fim.getTime() - existing.inicio.getTime()) / 60_000
  if (
    (changes.tipo === undefined ? existing.tipo : changes.tipo) === 'VISIT' &&
    durationMinutes < AGENDA_MINIMUM_VISIT_MINUTES
  ) {
    throw new AgendaVisitMinimumDurationError()
  }
  const unchangedStart = inicio.getTime() === existing.inicio.getTime()
  const fim = new Date(inicio.getTime() + durationMinutes * 60000)
  const unchangedPeriod = unchangedStart && fim.getTime() === existing.fim.getTime()
  if (!unchangedPeriod) {
    assertWithinAgendaSchedulingWindow(inicio, new Date(), {
      ...changes,
      durationMinutes,
      unchangedStart,
    })
  }
  if (
    await repository.hasOverlap(
      existing.tenantId,
      changes.responsavelId ?? existing.responsavelId,
      inicio,
      fim,
      existing.id,
    )
  ) {
    throw new AgendaEventConflictError()
  }
  return { inicio, fim }
}
