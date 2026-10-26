import type { CalendarMonth } from '@server/shared/types/time-zone-calendar'

import type { ChargeReadScope } from './charge-read-scope'
import type {
  ChargeAuditAction,
  ChargeAuditActorType,
  ChargeStatus,
  ChargeType,
  NewChargeStatus,
  StoredChargeStatus,
} from './charge'

export interface ChargeReceipt {
  id: string
  name: string
  contentType: string
  size: number
  uploadedAt: Date
}

export interface StoredCharge {
  id: string
  tenantId: string
  code: string
  type: ChargeType
  storedStatus: StoredChargeStatus
  amount: number
  dueDate: Date
  description: string | null
  paymentMethod: string | null
  paidAt: Date | null
  paidById: string | null
  cancelledAt: Date | null
  cancellationReason: string | null
  receipt: ChargeReceipt | null
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

export interface Charge extends StoredCharge {
  status: ChargeStatus
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

export interface ChargeChanges {
  description?: string | null
  type?: ChargeType
  amount?: number
  dueDate?: Date
}

export interface ChargePaymentData {
  paidAt: Date
  paymentMethod: string
  receipt: NewChargeReceipt | null
}

export interface NewChargeReceipt {
  id: string
  objectKey: string
  name: string
  contentType: string
  size: number
  sha256: string
}

export interface ChargeMutationActor {
  tenantId: string
  actorId: string
}

export interface ChargeListFilters {
  scope: ChargeReadScope
  today: Date
  type?: ChargeType
  status?: ChargeStatus
  dueMonth?: CalendarMonth
  search?: string
  page?: number
  pageSize?: number
}

export interface StoredChargeListItem {
  id: string
  code: string
  type: ChargeType
  storedStatus: StoredChargeStatus
  amount: number
  dueDate: Date
  description: string | null
  contractId: string | null
  payerName: string | null
  propertyTitle: string | null
  updatedAt: Date
}

export interface ChargeListItem extends StoredChargeListItem {
  status: ChargeStatus
}

export type ChargeStatusCounts = Record<ChargeStatus | 'ALL', number>

export interface ChargeListResult<TItem = ChargeListItem> {
  items: TItem[]
  totalCount: number
  statusCounts: ChargeStatusCounts
}

export interface ChargeExportRow {
  code: string
  description: string | null
  propertyTitle: string | null
  payerName: string | null
  type: ChargeType
  dueDate: Date
  amount: number
  status: ChargeStatus
  paidAt: Date | null
  paymentMethod: string | null
}

export interface FinancialMonthlyTotal {
  year: number
  month: number
  total: number
}

export interface StoredUpcomingCharge {
  id: string
  code: string
  description: string | null
  payerName: string | null
  propertyId: string | null
  propertyTitle: string | null
  dueDate: Date
  amount: number
  storedStatus: StoredChargeStatus
}

export interface FinancialUpcomingCharge extends StoredUpcomingCharge {
  status: ChargeStatus
}

export interface FinancialSummaryTotals {
  monthlyReceivable: number
  overdueTotal: number
  defaultRatePercentage: number
  occupancyRatePercentage: number
  monthlySeries: FinancialMonthlyTotal[]
  upcomingDues: StoredUpcomingCharge[]
}

export interface FinancialSummary extends Omit<FinancialSummaryTotals, 'upcomingDues'> {
  upcomingDues: FinancialUpcomingCharge[]
}

export interface ChargeAuditEvent {
  id: string
  action: ChargeAuditAction
  actorType: ChargeAuditActorType
  actorName: string | null
  changedFields: string[]
  fromStatus: StoredChargeStatus | null
  toStatus: StoredChargeStatus | null
  reason: string | null
  receipt: ChargeReceipt | null
  createdAt: Date
}
