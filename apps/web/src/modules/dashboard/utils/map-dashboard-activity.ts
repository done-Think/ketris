import dayjs from 'dayjs'

import type { AgendaEventApi } from '@modules/agenda/types/agenda-event'

import type {
  DashboardActivityAccent,
  DashboardUpcomingActivity,
} from '../types/dashboard-overview'

const accentByKind: Record<NonNullable<AgendaEventApi['kind']>, DashboardActivityAccent> = {
  VISIT: 'magenta',
  MEETING: 'info',
  FOLLOW_UP: 'warning',
  INSPECTION: 'magenta',
  SIGNATURE: 'magenta',
  OTHER: 'info',
}

export function toDashboardUpcomingActivity(event: AgendaEventApi): DashboardUpcomingActivity {
  const start = dayjs(event.start)

  return {
    id: event.id,
    time: start.format('HH:mm'),
    title: event.title,
    contact: event.participantName,
    phone: event.participantPhone,
    accent: event.kind ? accentByKind[event.kind] : 'info',
    meetingTime: start.format('HH:mm'),
    notes: event.notes ?? '',
    propertyId: event.propertyId,
    propertyReference: event.propertyReference,
  }
}
