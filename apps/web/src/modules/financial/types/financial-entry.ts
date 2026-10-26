import type { ChargeStatus } from './charge'

export type FinancialEntry = {
  id: string
  date: string
  description: string
  property: string
  client: string
  amountValue: number
  status: ChargeStatus
}

export type FinancialMonthlyMovement = {
  month: string
  revenue: number
}

export type FinancialKpiTone = 'success' | 'warning' | 'error' | 'info'

export type FinancialKpi = {
  id: string
  labelKey: string
  value: string
  tone: FinancialKpiTone
}

export type FinancialUpcomingDue = {
  id: string
  property: string
  client: string
  dueDate: string
  amountValue: number
  status: ChargeStatus
}

export type FinancialKpiCardsProps = {
  kpis: FinancialKpi[]
}

export type FinancialDashboardHeaderActionsProps = {
  month: string
  months: string[]
  exporting: boolean
  onMonthChange: (month: string) => void
  onExport: () => void
}

export type FinancialEntriesTableProps = {
  entries: FinancialEntry[]
  onOpen: (id: string) => void
}

export type FinancialMovementChartProps = {
  movement: FinancialMonthlyMovement[]
}

export type FinancialUpcomingDueListProps = {
  items: FinancialUpcomingDue[]
  onOpen: (id: string) => void
}
