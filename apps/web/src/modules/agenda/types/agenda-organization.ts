import type { z } from 'zod'
import type { chargeListItemSchema } from '@server/financial/schemas/charge.schema'
import type { maintenanceTicketListItemSchema } from '@server/maintenance/schemas/maintenance-ticket.schema'
import type { AgendaTimeSlot } from './agenda-event'

export type AgendaChargeApi = Pick<
  z.infer<typeof chargeListItemSchema>,
  'id' | 'code' | 'description' | 'dueDate' | 'amount' | 'propertyTitle' | 'status'
>
export type AgendaMaintenanceApi = Pick<
  z.infer<typeof maintenanceTicketListItemSchema>,
  'id' | 'title' | 'propertyTitle' | 'createdAt' | 'scheduledAt' | 'status'
>

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
