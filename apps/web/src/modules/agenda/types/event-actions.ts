import type { AgendaEvent, AgendaPropertyOption } from './agenda-event'

export interface AgendaEventActionsOptions {
  tenantId: string
  selectedEvent: AgendaEvent | null
  readOnly: boolean
  selectedEventReadOnly: boolean
  propertiesById: Record<string, AgendaPropertyOption>
  onCreated: (date: string) => void
  onUpdated: (event: AgendaEvent, date: string) => void
}
