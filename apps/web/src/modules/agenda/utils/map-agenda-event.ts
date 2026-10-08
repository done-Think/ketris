import dayjs from 'dayjs'

import type {
  AgendaEvent,
  AgendaEventApi,
  AgendaEventTone,
  AgendaPropertyOption,
} from '../types/agenda-event'

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

export function toAgendaEvent(
  api: AgendaEventApi,
  propertiesById: Record<string, AgendaPropertyOption> = {},
): AgendaEvent {
  const start = dayjs(api.start)
  const linkedProperty = api.propertyId ? propertiesById[api.propertyId] : undefined

  return {
    id: api.id,
    scheduledDate: start.format('YYYY-MM-DD'),
    time: start.format('HH:mm'),
    durationMinutes: dayjs(api.end).diff(start, 'minute'),
    title: api.title,
    property: api.propertyReference ?? linkedProperty?.label ?? '',
    propertyHref: linkedProperty?.href ?? '/dashboard/properties',
    propertyId: api.propertyId,
    apiKind: api.kind,
    participant: api.participantName,
    phone: api.participantPhone,
    notes: api.notes ?? '',
    status: statusByApiStatus[api.status],
    tone: toneByApiStatus[api.status],
    kind: api.kind ? kindByApiKind[api.kind] : undefined,
  }
}
