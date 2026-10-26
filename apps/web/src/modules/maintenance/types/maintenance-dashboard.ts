import type { MaintenanceTicket } from './maintenance'
export interface MaintenanceTicketsTableProps {
  pagedTickets: MaintenanceTicket[]
  totalCount: number
  currentPage: number
  rowsPerPage: number
  setCurrentPage: (page: number) => void
  onRowsPerPageChange: (rows: number) => void
  onOpenMenu: (anchor: HTMLElement, ticketId: string) => void
}

export interface MaintenanceDashboardFilters {
  activeFilter: import('./maintenance').MaintenanceFilter['value']
  search: string
  propertyFilter: string
  currentPage: number
  rowsPerPage: number
  archived: boolean
}

export type MaintenanceDashboardDialog =
  | { kind: 'create' | 'filters' | 'links' | 'providers' }
  | { kind: 'edit' | 'delete'; ticketId: string }
  | null

export interface MaintenanceDashboardMenu {
  anchor: HTMLElement
  ticketId: string
}
