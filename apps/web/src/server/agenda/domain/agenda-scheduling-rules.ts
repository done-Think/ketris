import {
  AGENDA_MINIMUM_ADVANCE_HOURS,
  isAgendaPeriodWithinBusinessHours,
  isAgendaHalfHourStart,
} from '@shared/lib/utils/agenda-scheduling'
import {
  AgendaMinimumAdvanceNoticeError,
  AgendaOutsideBusinessHoursError,
  AgendaTimeSlotInvalidError,
} from './errors'
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
  if (!options.unchangedStart && !isAgendaHalfHourStart(start))
    throw new AgendaTimeSlotInvalidError()
  const end = new Date(start.getTime() + (options.durationMinutes ?? 0) * 60000)
  if (!options.outsideBusinessHoursConfirmed && !isAgendaPeriodWithinBusinessHours(start, end))
    throw new AgendaOutsideBusinessHoursError()
}
