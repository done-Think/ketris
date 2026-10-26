import type { ReactNode } from 'react'

import type { DashboardTablePaginationProps } from '@shared/types/dashboard-table-pagination'

export interface CrmListLayoutProps {
  embedded?: boolean
  header: ReactNode
  filters: ReactNode
  table: ReactNode
  cards: ReactNode
  isEmpty: boolean
  emptyMessage: string
  isLoading?: boolean
  error?: boolean
  onRetry?: () => void
  pagination: DashboardTablePaginationProps
}
