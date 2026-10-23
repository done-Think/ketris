import type { ReactNode } from 'react'

import type { DashboardTablePaginationProps } from '@shared/types/dashboard-table-pagination'

export interface CrmListLayoutProps {
  header: ReactNode
  filters: ReactNode
  table: ReactNode
  cards: ReactNode
  isEmpty: boolean
  emptyMessage: string
  pagination: DashboardTablePaginationProps
}
