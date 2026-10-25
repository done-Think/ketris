import type { AgendaEvent } from '../domain/agenda-event.entity'

export type AgendaPropertyReservation = Pick<
  AgendaEvent,
  'tenantId' | 'imovelId' | 'tipo' | 'inicio' | 'fim'
> &
  Partial<Pick<AgendaEvent, 'id' | 'status'>>
export type AgendaResponsibleReservation = Pick<
  AgendaEvent,
  'tenantId' | 'responsavelId' | 'inicio' | 'fim'
> &
  Partial<Pick<AgendaEvent, 'id' | 'status'>>
