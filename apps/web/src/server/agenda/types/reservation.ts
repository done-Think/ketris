import type { AgendaEvent } from '../domain/agenda-event.entity'

export type AgendaPropertyReservation = Pick<
  AgendaEvent,
  'tenantId' | 'propertyId' | 'type' | 'start' | 'end'
> &
  Partial<Pick<AgendaEvent, 'id' | 'status'>>
export type AgendaResponsibleReservation = Pick<
  AgendaEvent,
  'tenantId' | 'responsibleId' | 'start' | 'end'
> &
  Partial<Pick<AgendaEvent, 'id' | 'status'>>
