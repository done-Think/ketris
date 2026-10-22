import type { AgendaTimeSlot } from './agenda-event'

export interface AgendaChargeApi {
  id: string
  code: string
  description: string | null
  dueDate: string
  amount: number
  propertyTitle: string | null
  status: 'PENDENTE' | 'PAGA' | 'ATRASADA' | 'AGENDADA' | 'CANCELADA'
}

export interface AgendaMaintenanceApi {
  id: string
  title: string
  propertyTitle: string
  createdAt: string
  scheduledAt?: string | null
  status:
    | 'ABERTO'
    | 'EM_ANDAMENTO'
    | 'RESOLVIDO'
    | 'FECHADO'
    | 'AGUARDANDO_CONFIRMACAO'
    | 'CONTESTADO'
    | 'CANCELADO'
}

export interface AgendaPage<T> {
  items: T[]
  totalCount: number
}

export type AgendaOrganizationItem = {
  id: string
  sourceId: string
  kind: 'charge' | 'ticketOpened' | 'ticketScheduled'
  date: string
  time?: string
  title: string
  property: string
  status: AgendaChargeApi['status'] | AgendaMaintenanceApi['status']
  amount?: number
}

export interface AgendaOrganizationCardProps {
  item: AgendaOrganizationItem
}

export interface AgendaDayOrganization {
  items: AgendaOrganizationItem[]
  timedItems: AgendaOrganizationItem[]
  allDayItems: AgendaOrganizationItem[]
}

export interface AgendaTimeline {
  itemsByDay: Record<string, AgendaDayOrganization>
  calendarTimeSlots: AgendaTimeSlot[]
  firstHour: number
  hasAllDayItems: boolean
}
