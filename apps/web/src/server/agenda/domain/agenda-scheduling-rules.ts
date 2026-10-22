import {
  AGENDA_MINIMUM_ADVANCE_HOURS,
  isAgendaPeriodWithinBusinessHours,
} from '@shared/lib/utils/agenda-scheduling'
import { AgendaMinimumAdvanceNoticeError, AgendaOutsideBusinessHoursError } from './errors'
export {
  AGENDA_MINIMUM_ADVANCE_HOURS,
  AGENDA_BUSINESS_HOURS_START,
  AGENDA_BUSINESS_HOURS_END,
  AGENDA_TIMEZONE,
} from '@shared/lib/utils/agenda-scheduling'

export function assertWithinAgendaSchedulingWindow(
  start: Date,
  now: Date = new Date(),
  options: {
    durationMinutes?: number
    outsideBusinessHoursConfirmed?: boolean
    unchangedStart?: boolean
  } = {},
): void {
  const minimumStart = new Date(now.getTime() + AGENDA_MINIMUM_ADVANCE_HOURS * 3600000)
  if (!options.unchangedStart && start < minimumStart) throw new AgendaMinimumAdvanceNoticeError()
  const end = new Date(start.getTime() + (options.durationMinutes ?? 0) * 60000)
  if (!options.outsideBusinessHoursConfirmed && !isAgendaPeriodWithinBusinessHours(start, end))
    throw new AgendaOutsideBusinessHoursError()
}
