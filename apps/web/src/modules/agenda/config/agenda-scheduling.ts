import {
  AGENDA_BUSINESS_HOURS_START,
  AGENDA_BUSINESS_HOURS_END,
} from '@shared/lib/utils/agenda-scheduling'
import type { AgendaTimeSlot } from '../types/agenda-event'

export const agendaTimeSlots: AgendaTimeSlot[] = Array.from(
  { length: AGENDA_BUSINESS_HOURS_END - AGENDA_BUSINESS_HOURS_START + 1 },
  (_, index) => {
    const hour = AGENDA_BUSINESS_HOURS_START + index
    return { label: `${String(hour).padStart(2, '0')}:00`, hour }
  },
)
