export type ApiChargeType = 'A_RECEBER' | 'A_PAGAR'

export type ApiChargeStatus = 'PENDENTE' | 'PAGA' | 'ATRASADA' | 'AGENDADA' | 'CANCELADA'

export type ApiNewChargeStatus = Extract<ApiChargeStatus, 'PENDENTE' | 'AGENDADA'>

export interface ApiCharge {
  id: string
  code: string
  type: ApiChargeType
  status: ApiChargeStatus
  amount: number
  dueDate: string
  description: string | null
  paymentMethod: string | null
  receiptUrl: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
  contractId: string | null
  contractCode: string | null
  propertyId: string | null
  propertyTitle: string | null
  propertyAddress: string | null
  payerName: string | null
  payerEmail: string | null
}

export interface ApiChargeListItem {
  id: string
  code: string
  type: ApiChargeType
  status: ApiChargeStatus
  amount: number
  dueDate: string
  description: string | null
  contractId: string | null
  payerName: string | null
  propertyTitle: string | null
  updatedAt: string
}

export interface ChargeListFilters {
  type?: ApiChargeType
  status?: ApiChargeStatus
  search?: string
  page?: number
  pageSize?: number
}

export interface CreateChargePayload {
  contractId?: string
  description?: string
  type: ApiChargeType
  amount: number
  dueDate: string
  status: ApiNewChargeStatus
}

export interface UpdateChargePayload {
  description?: string | null
  type: ApiChargeType
  amount: number
  dueDate: string
  status: ApiChargeStatus
}

export interface RegisterChargePaymentPayload {
  paidAt: string
  paymentMethod: string
  receiptUrl?: string | null
}

export interface ListChargesResponse {
  items: ApiChargeListItem[]
  totalCount: number
}

export interface ChargeResponse {
  charge: ApiCharge
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
  dueDate: string
  amount: number
  status: ApiChargeStatus
}

export interface FinancialSummary {
  monthlyReceivable: number
  overdueTotal: number
  defaultRatePercentage: number
  monthlySeries: FinancialMonthlyTotal[]
  upcomingDues: FinancialUpcomingCharge[]
}
