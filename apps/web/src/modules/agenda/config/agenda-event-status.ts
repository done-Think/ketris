import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import type { SvgIconComponent } from '@mui/icons-material'

import type { AgendaEventDisplayStatus, AgendaEventTone } from '../types/agenda-event'

export const agendaDisplayStatusTones: Record<AgendaEventDisplayStatus, AgendaEventTone> = {
  CONFIRMED: 'primary',
  PENDING: 'warning',
  RESCHEDULE: 'info',
  CANCELLED: 'neutral',
  COMPLETED: 'success',
  NO_SHOW: 'neutral',
  AWAITING_OUTCOME: 'warning',
}

export const agendaDisplayStatusIcons: Partial<Record<AgendaEventDisplayStatus, SvgIconComponent>> =
  {
    COMPLETED: CheckCircleRoundedIcon,
    NO_SHOW: EventBusyRoundedIcon,
    AWAITING_OUTCOME: ScheduleRoundedIcon,
  }
