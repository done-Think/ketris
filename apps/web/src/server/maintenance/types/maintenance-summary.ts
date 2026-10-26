import type { MaintenanceTicketStatus } from './maintenance-ticket'

export interface MaintenanceSummary {
  totalCount: number
  urgentCount: number
  byStatus: Partial<Record<MaintenanceTicketStatus, number>>
  averageResolutionDays: number | null
}
export interface MaintenancePagination {
  page: number
  pageSize: number
  pageCount: number
  totalCount: number
}
export interface MaintenanceSummaryRow {
  status: MaintenanceTicketStatus
  count: bigint
  urgent: bigint
  resolutionDays: import('@prisma/client').Prisma.Decimal | null
  resolved: bigint
}
