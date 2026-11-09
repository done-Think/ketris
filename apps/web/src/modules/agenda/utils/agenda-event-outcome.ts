import dayjs, { type Dayjs } from 'dayjs'

import {
  hasAgendaEventStarted,
  isAgendaOutcomeStatus,
  requiresAgendaVisitInterest,
} from '@shared/lib/utils/agenda-outcome'

import { agendaDisplayStatusIcons, agendaDisplayStatusTones } from '../config/agenda-event-status'
import { agendaOtherPropertyValue } from '../schemas/agenda-event-form-schema'
import type { AgendaActor } from '../types/agenda-access'
import type {
  AgendaEvent,
  AgendaEventDisplayStatus,
  AgendaEventFormValues,
  AgendaEventPresentation,
  RecordAgendaEventOutcomePayload,
  RecordAgendaEventOutcomeValues,
} from '../types/agenda-event'
import { canEditAgendaEvent } from './can-edit-agenda-event'

export function agendaEventStart(event: AgendaEvent): Dayjs {
  return dayjs(`${event.scheduledDate}T${event.time}`)
}

export function isAgendaEventClosed(event: AgendaEvent): boolean {
  return isAgendaOutcomeStatus(event.status)
}

export function isAgendaEventAwaitingOutcome(event: AgendaEvent, now: Dayjs): boolean {
  if (event.status === 'CANCELLED' || isAgendaEventClosed(event)) return false
  return !agendaEventStart(event).add(event.durationMinutes, 'minute').isAfter(now)
}

export function getAgendaEventDisplayStatus(
  event: AgendaEvent,
  now: Dayjs,
): AgendaEventDisplayStatus {
  return isAgendaEventAwaitingOutcome(event, now) ? 'AWAITING_OUTCOME' : event.status
}

export function getAgendaEventPresentation(
  event: AgendaEvent,
  now: Dayjs,
): AgendaEventPresentation {
  const displayStatus = getAgendaEventDisplayStatus(event, now)

  return {
    displayStatus,
    tone: displayStatus === event.status ? event.tone : agendaDisplayStatusTones[displayStatus],
    StatusIcon: agendaDisplayStatusIcons[displayStatus],
  }
}

export function canRecordAgendaEventOutcome(
  actor: AgendaActor,
  event: AgendaEvent | null,
  now: Dayjs,
): boolean {
  if (!event || (actor.role !== 'OWNER' && actor.role !== 'AGENT')) return false
  if (!canEditAgendaEvent(actor, event) || event.status === 'CANCELLED') return false
  if (isAgendaEventClosed(event)) return actor.role === 'OWNER'
  return hasAgendaEventStarted(agendaEventStart(event).toDate(), now.toDate())
}

export function toRecordAgendaEventOutcomePayload(
  values: RecordAgendaEventOutcomeValues,
  event: AgendaEvent,
): RecordAgendaEventOutcomePayload {
  const notes = values.notes.trim()

  return {
    outcome: values.outcome,
    ...(requiresAgendaVisitInterest(values.outcome, event.apiKind) && values.visitInterest
      ? { visitInterest: values.visitInterest }
      : {}),
    ...(notes ? { notes } : {}),
  }
}

export function buildFollowUpFormValues(
  event: AgendaEvent,
  title: string,
  keepAudience: boolean,
): Partial<AgendaEventFormValues> {
  return {
    title,
    kind: 'FOLLOW_UP',
    participant: event.participant,
    phone: event.phone,
    propertyId: event.propertyId ?? (event.property ? agendaOtherPropertyValue : ''),
    customProperty: event.propertyId ? '' : event.property,
    ...(keepAudience && event.audience
      ? {
          audience: event.audience,
          internal: event.internal ?? false,
          responsibleId: event.responsibleId ?? '',
        }
      : {}),
  }
}
