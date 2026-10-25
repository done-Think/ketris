import type { AgendaReadActor } from './read-actor'

export interface AgendaPropertyOption {
  id: string
  label: string
}
export interface AgendaPropertyOptionsQuery extends AgendaReadActor {
  page: number
  pageSize: number
  search?: string
}
export interface AgendaPropertyOptionsPage {
  items: AgendaPropertyOption[]
  total: number
  page: number
  pageSize: number
}

export interface PreparedAgendaPropertySummary {
  propertyLabel: string | null
}
