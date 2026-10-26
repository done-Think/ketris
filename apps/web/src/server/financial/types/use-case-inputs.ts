import type { CalendarMonth } from '@server/shared/types/time-zone-calendar'

import type { ChargeReadActor } from './charge-read'
import type { ChargeExportLocale, ChargeStatus, ChargeType, NewChargeStatus } from './charge'

export type ChargeActor = ChargeReadActor

export interface ListChargesInput extends ChargeActor {
  type?: ChargeType
  status?: ChargeStatus
  dueMonth?: CalendarMonth
  search?: string
  page?: number
  pageSize?: number
}

export interface GetChargeInput extends ChargeActor {
  chargeId: string
}

export interface CreateChargeInput extends ChargeActor {
  contractId: string | null
  description: string | null
  type: ChargeType
  amount: number
  dueDate: Date
  status: NewChargeStatus
}

export interface UpdateChargeInput extends ChargeActor {
  chargeId: string
  description?: string | null
  type?: ChargeType
  amount?: number
  dueDate?: Date
}

export interface RegisterChargePaymentInput extends ChargeActor {
  chargeId: string
  paidAt: Date
  paymentMethod: string
  receiptUploadToken: string | null
}

export interface ChargeReasonInput extends ChargeActor {
  chargeId: string
  reason: string
}

export interface InitChargeReceiptUploadInput extends ChargeActor {
  chargeId: string
  name: string
  contentType: string
  size: number
  sha256: string
}

export interface DownloadChargeReceiptInput extends ChargeActor {
  chargeId: string
  receiptId: string
}

export interface GetFinancialSummaryInput {
  actorTenantId: string
  actorPapel: ChargeActor['actorPapel']
  month?: CalendarMonth
}

export interface ExportChargesInput extends ChargeActor {
  month: CalendarMonth
  locale: ChargeExportLocale
}
