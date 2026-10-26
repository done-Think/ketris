export type ApiChargeType = 'A_RECEBER' | 'A_PAGAR'

export type ApiChargeStatus = 'PENDENTE' | 'PAGA' | 'ATRASADA' | 'AGENDADA' | 'CANCELADA'

export type ApiStoredChargeStatus = Exclude<ApiChargeStatus, 'ATRASADA'>

export type ApiNewChargeStatus = Extract<ApiChargeStatus, 'PENDENTE' | 'AGENDADA'>

export type ApiChargeAuditAction =
  'CREATED' | 'UPDATED' | 'PAYMENT_REGISTERED' | 'PAYMENT_REVERSED' | 'CANCELLED' | 'DELETED'

export interface ApiChargeReceipt {
  id: string
  name: string
  contentType: string
  size: number
  uploadedAt: string
}

export interface ApiCharge {
  id: string
  code: string
  type: ApiChargeType
  status: ApiChargeStatus
  amount: number
  dueDate: string
  description: string | null
  paymentMethod: string | null
  paidAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  receipt: ApiChargeReceipt | null
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

export type ApiChargeStatusCounts = Record<ApiChargeStatus | 'ALL', number>

export interface ChargeListFilters {
  type?: ApiChargeType
  status?: ApiChargeStatus
  dueMonth?: string
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
  type?: ApiChargeType
  amount?: number
  dueDate?: string
}

export interface RegisterChargePaymentPayload {
  paidAt: string
  paymentMethod: string
  receiptUploadToken?: string
}

export interface ChargeReasonPayload {
  reason: string
}

export interface ListChargesResponse {
  items: ApiChargeListItem[]
  totalCount: number
  statusCounts: ApiChargeStatusCounts
}

export interface ChargeResponse {
  charge: ApiCharge
}

export interface ApiChargeAuditEvent {
  id: string
  action: ApiChargeAuditAction
  actorType: 'USER' | 'SYSTEM'
  actorName: string | null
  changedFields: string[]
  fromStatus: ApiStoredChargeStatus | null
  toStatus: ApiStoredChargeStatus | null
  reason: string | null
  receipt: ApiChargeReceipt | null
  createdAt: string
}

export interface ChargeHistoryResponse {
  events: ApiChargeAuditEvent[]
}

export interface ChargeReceiptUploadAuthorization {
  uploadUrl: string
  headers: Record<string, string>
  uploadToken: string
  expiresAt: string
}

export interface ChargeReceiptDownload {
  url: string
  expiresAt: string
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
  occupancyRatePercentage: number
  monthlySeries: FinancialMonthlyTotal[]
  upcomingDues: FinancialUpcomingCharge[]
}
