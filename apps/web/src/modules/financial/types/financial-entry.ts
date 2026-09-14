export type FinancialEntryStatus = 'Recebido' | 'Previsto' | 'Atrasado'

export type FinancialEntryType = 'Venda' | 'Comissão'

export type FinancialEntry = {
  id: string
  type: FinancialEntryType
  description: string
  property: string
  dueDate: string
  month: string
  amount: string
  amountValue: number
  status: FinancialEntryStatus
}

export type FinancialMonthlyMovement = {
  month: string
  sales: number
  commissions: number
}

export type FinancialEntriesTableProps = {
  entries: FinancialEntry[]
}

export type FinancialMovementChartProps = {
  movement: FinancialMonthlyMovement[]
}
