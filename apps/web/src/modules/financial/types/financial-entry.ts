export type FinancialEntryStatus = 'Pago' | 'Pendente' | 'Atrasado'

export type FinancialEntry = {
  id: string
  propertyId: string
  date: string
  description: string
  property: string
  client: string
  contactId: string
  amountValue: number
  status: FinancialEntryStatus
  receipts: FinancialReceipt[]
}

export type FinancialReceipt = {
  id: string
  title: string
  issuer: string
  issuedAt: string
  amountValue: number
  fileName: string
}

export type FinancialDueHistoryEntry = {
  id: string
  date: string
  description: string
  property: string
  amountValue: number
  status: FinancialEntryStatus
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
  helper: string
  tone: FinancialKpiTone
}

export type FinancialUpcomingDue = {
  id: string
  propertyId: string
  property: string
  contactId: string
  client: string
  dueDate: string
  amountValue: number
  status: FinancialEntryStatus
  history: FinancialDueHistoryEntry[]
}

export type FinancialStatusStyle = {
  bgcolor: string
  color: string
}

export type FinancialKpiCardsProps = {
  kpis: FinancialKpi[]
}

export type FinancialEntriesTableProps = {
  entries: FinancialEntry[]
}

export type FinancialMovementChartProps = {
  movement: FinancialMonthlyMovement[]
}

export type FinancialUpcomingDueListProps = {
  items: FinancialUpcomingDue[]
}

export type FinancialDueHistoryDialogProps = {
  due: FinancialUpcomingDue | null
  onClose: () => void
  open: boolean
}

export type FinancialEntryDetailDialogProps = {
  entry: FinancialEntry | null
  onClose: () => void
  open: boolean
}
