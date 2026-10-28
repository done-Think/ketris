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
  const start = changes.start ?? existing.start
  const durationMinutes =
    changes.durationMinutes ?? (existing.end.getTime() - existing.start.getTime()) / 60_000
  if (
    (changes.type === undefined ? existing.type : changes.type) === 'VISIT' &&
    durationMinutes < AGENDA_MINIMUM_VISIT_MINUTES
  ) {
    throw new AgendaVisitMinimumDurationError()
  }
  const unchangedStart = start.getTime() === existing.start.getTime()
  const end = new Date(start.getTime() + durationMinutes * 60000)
  const unchangedPeriod = unchangedStart && end.getTime() === existing.end.getTime()
  if (!unchangedPeriod) {
    assertWithinAgendaSchedulingWindow(start, new Date(), {
      ...changes,
      durationMinutes,
      unchangedStart,
    })
  }
  if (
    await repository.hasOverlap(
      existing.tenantId,
      changes.responsibleId ?? existing.responsibleId,
      start,
      end,
      existing.id,
    )
  ) {
    throw new AgendaEventConflictError()
  }
  return { start, end }
}
