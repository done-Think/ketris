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
