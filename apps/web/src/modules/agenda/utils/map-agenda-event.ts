import dayjs from 'dayjs'

import type { AgendaEvent, AgendaEventApi, AgendaEventTone } from '../types/agenda-event'

const kindByApiKind: Record<
  NonNullable<AgendaEventApi['kind']>,
  NonNullable<AgendaEvent['kind']>
> = {
  VISIT: 'visit',
  FOLLOW_UP: 'followUp',
  MEETING: 'meeting',
  INSPECTION: 'inspection',
  SIGNATURE: 'signature',
  OTHER: 'visit',
}

const toneByApiStatus: Record<AgendaEventApi['status'], AgendaEventTone> = {
  CONFIRMED: 'primary',
  PENDING: 'warning',
  RESCHEDULE: 'info',
  CANCELLED: 'info',
}

const statusByApiStatus: Record<AgendaEventApi['status'], AgendaEvent['status']> = {
  CONFIRMED: 'Confirmada',
  PENDING: 'Pendente',
  RESCHEDULE: 'Reagendar',
  CANCELLED: 'Reagendar',
}

export function toAgendaEvent(api: AgendaEventApi): AgendaEvent {
  const start = dayjs(api.start)

  return {
    id: api.id,
    scheduledDate: start.format('YYYY-MM-DD'),
    time: start.format('HH:mm'),
    durationMinutes: dayjs(api.end).diff(start, 'minute'),
    title: api.title,
    property: api.propertyReference ?? '',
    propertyHref: '/dashboard/properties',
    participant: api.participantName,
    phone: api.participantPhone,
    notes: api.notes ?? '',
    status: statusByApiStatus[api.status],
    tone: toneByApiStatus[api.status],
    kind: api.kind ? kindByApiKind[api.kind] : undefined,
  }
}
