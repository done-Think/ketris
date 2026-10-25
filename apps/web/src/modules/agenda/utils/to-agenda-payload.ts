import dayjs from 'dayjs'
import { agendaOtherPropertyValue } from '../schemas/agenda-event-form-schema'
import type {
  AgendaEventFormValues,
  CreateAgendaEventPayload,
  UpdateAgendaEventPayload,
} from '../types/agenda-event'
import { toAgendaAudiencePayload } from './map-agenda-event'

function agendaFormPayload(values: AgendaEventFormValues) {
  return {
    ...toAgendaAudiencePayload(values),
    title: values.title,
    start: dayjs(`${values.scheduledDate}T${values.scheduledTime}`).toISOString(),
    durationMinutes: values.durationMinutes,
    participantName: values.participant,
    participantPhone: values.phone,
  }
}
export function toCreateAgendaPayload(
  values: AgendaEventFormValues,
  defaultNotes: string,
): CreateAgendaEventPayload {
  return {
    ...agendaFormPayload(values),
    kind: values.kind || undefined,
    ...(values.propertyId === agendaOtherPropertyValue
      ? { propertyReference: values.customProperty.trim() }
      : values.propertyId
        ? { propertyId: values.propertyId }
        : {}),
    notes: values.notes.trim() || defaultNotes,
  }
}
export function toUpdateAgendaPayload(values: AgendaEventFormValues): UpdateAgendaEventPayload {
  return {
    ...agendaFormPayload(values),
    kind: values.kind || null,
    ...(values.propertyId === agendaOtherPropertyValue
      ? { propertyId: null, propertyReference: values.customProperty.trim() }
      : { propertyId: values.propertyId || null, propertyReference: null }),
    notes: values.notes.trim() || null,
  }
}
