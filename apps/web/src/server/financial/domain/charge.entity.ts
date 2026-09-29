export type ChargeType = 'A_RECEBER' | 'A_PAGAR'

export type ChargeStatus = 'PENDENTE' | 'PAGA' | 'ATRASADA' | 'AGENDADA' | 'CANCELADA'

export type NewChargeStatus = Extract<ChargeStatus, 'PENDENTE' | 'AGENDADA'>

export interface Charge {
  id: string
  tenantId: string
  code: string
  type: ChargeType
  status: ChargeStatus
  amount: number
  dueDate: Date
  description: string | null
  paymentMethod: string | null
  receiptUrl: string | null
  paidAt: Date | null
  createdAt: Date
  updatedAt: Date
  contractId: string | null
  contractCode: string | null
  propertyId: string | null
  propertyTitle: string | null
  propertyAddress: string | null
  payerName: string | null
  payerEmail: string | null
}

export interface NewCharge {
  tenantId: string
  contractId: string | null
  description: string | null
  type: ChargeType
  amount: number
  dueDate: Date
  status: NewChargeStatus
}

export interface ChargeUpdateData {
  description: string | null
  type: ChargeType
  amount: number
  dueDate: Date
  status: ChargeStatus
  paymentMethod: string | null
  receiptUrl: string | null
  paidAt: Date | null
}

export interface ChargePaymentData {
  paidAt: Date
  paymentMethod: string
  receiptUrl: string | null
}

export interface ChargeListFilters {
  tenantId: string
  type?: ChargeType
  status?: ChargeStatus
  search?: string
  page?: number
  pageSize?: number
}

export interface ChargeListItem {
  id: string
  code: string
  type: ChargeType
  status: ChargeStatus
  amount: number
  dueDate: Date
  description: string | null
  contractId: string | null
  payerName: string | null
  propertyTitle: string | null
  updatedAt: Date
}

export interface ChargeListResult {
  items: ChargeListItem[]
  totalCount: number
}

export interface FinancialMonthlyTotal {
  year: number
  month: number
  total: number
}

export interface FinancialUpcomingCharge {
  id: string
  code: string
  description: string | null
  payerName: string | null
  propertyId: string | null
  propertyTitle: string | null
  dueDate: Date
  amount: number
  status: ChargeStatus
}

export interface FinancialSummary {
  monthlyReceivable: number
  overdueTotal: number
  defaultRatePercentage: number
  monthlySeries: FinancialMonthlyTotal[]
  upcomingDues: FinancialUpcomingCharge[]
}
