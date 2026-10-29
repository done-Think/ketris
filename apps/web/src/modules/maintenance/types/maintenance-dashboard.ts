import type { MaintenanceCategory } from '@shared/lib/utils/maintenance-categories'
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
  categoryFilter: MaintenanceCategory | 'all'
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

export interface MaintenanceCategoryFilterProps {
  value: MaintenanceDashboardFilters['categoryFilter']
  onChange: (value: MaintenanceDashboardFilters['categoryFilter']) => void
  compact?: boolean
}
