import type { components } from '@shared/types/generated/api'
import type { AgendaTimeSlot } from './agenda-event'

export type AgendaChargeApi = Pick<
  components['schemas']['ChargeListItem'],
  'id' | 'code' | 'description' | 'dueDate' | 'amount' | 'propertyTitle' | 'status'
>
export type AgendaMaintenanceApi = Pick<
  components['schemas']['MaintenanceTicketListItem'],
  'id' | 'title' | 'propertyTitle' | 'createdAt' | 'scheduledAt' | 'status'
>

export interface AgendaPage<T> {
  items: T[]
  totalCount: number
}

type AgendaOrganizationBase = {
  id: string
  sourceId: string
  date: string
  time?: string
  title: string
  property: string
  amount?: number
}

export type AgendaOrganizationItem = AgendaOrganizationBase &
  (
    | { kind: 'charge'; status: AgendaChargeApi['status'] }
    | { kind: 'ticketOpened' | 'ticketScheduled'; status: AgendaMaintenanceApi['status'] }
  )

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
