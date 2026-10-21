import dayjs from 'dayjs'

import type {
  AgendaEvent,
  AgendaEventApi,
  AgendaEventReadApi,
  AgendaEventTone,
  AgendaPropertyOption,
  AgendaEventFormValues,
  CreateAgendaEventPayload,
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

export function toAgendaAudiencePayload(
  values: AgendaEventFormValues,
): Pick<
  CreateAgendaEventPayload,
  'audience' | 'internal' | 'responsibleId' | 'outsideBusinessHoursConfirmed'
> {
  const confirmation = values.outsideBusinessHoursConfirmed
    ? { outsideBusinessHoursConfirmed: true }
    : {}
  if (values.audience === 'LEGACY_TEAM') return confirmation
  return {
    ...confirmation,
    audience: values.audience,
    internal: values.internal,
    ...(values.audience === 'ASSIGNED_AGENT' ? { responsibleId: values.responsibleId } : {}),
  }
}

export function toAgendaEvent(
  api: AgendaEventReadApi,
  propertiesById: Record<string, AgendaPropertyOption> = {},
): AgendaEvent {
  const start = dayjs(api.start)
  const linkedProperty = api.propertyId ? propertiesById[api.propertyId] : undefined

  return {
    id: api.id,
    audience: 'audience' in api ? api.audience : undefined,
    internal: 'internal' in api ? api.internal : undefined,
    responsibleId: 'responsibleId' in api ? api.responsibleId : undefined,
    scheduledDate: start.format('YYYY-MM-DD'),
    time: start.format('HH:mm'),
    durationMinutes: dayjs(api.end).diff(start, 'minute'),
    title: api.title,
    property: api.propertyReference ?? linkedProperty?.label ?? '',
    propertyHref: linkedProperty?.href ?? '/dashboard/properties',
    propertyId: api.propertyId,
    apiKind: api.kind,
    participant: 'participantName' in api ? api.participantName : api.responsibleName,
    phone: 'participantPhone' in api ? api.participantPhone : '',
    notes: 'notes' in api ? (api.notes ?? '') : '',
    responsibleName: 'responsibleName' in api ? api.responsibleName : undefined,
    status: statusByApiStatus[api.status],
    tone: toneByApiStatus[api.status],
    kind: api.kind ? kindByApiKind[api.kind] : undefined,
  }
}
