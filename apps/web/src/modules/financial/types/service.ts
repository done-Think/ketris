import type { components, paths } from '@shared/types/generated/api'
export type ApiChargeType = components['schemas']['Charge']['type']

export type ApiChargeStatus = components['schemas']['Charge']['status']

export type ApiStoredChargeStatus = NonNullable<
  components['schemas']['ChargeAuditEvent']['fromStatus']
>

export type ApiNewChargeStatus = components['schemas']['CreateChargeRequest']['status']

export type ApiChargeAuditAction = components['schemas']['ChargeAuditEvent']['action']

export type ApiChargeReceipt = NonNullable<components['schemas']['ChargeReceipt']>

export type ApiCharge = components['schemas']['Charge']

export type ApiChargeListItem = components['schemas']['ChargeListItem']

export type ApiChargeStatusCounts = components['schemas']['ChargeStatusCounts']

export type ChargeListFilters = NonNullable<
  paths['/financial/charges']['get']['parameters']['query']
>

export type CreateChargePayload = components['schemas']['CreateChargeRequest']

export type UpdateChargePayload = components['schemas']['UpdateChargeRequest']

export type RegisterChargePaymentPayload = components['schemas']['RegisterChargePaymentRequest']

export type ChargeReasonPayload = components['schemas']['ChargeReasonRequest']

export type ListChargesResponse = components['schemas']['ChargesResponse']

export type ChargeResponse = components['schemas']['ChargeResponse']

export type ApiChargeAuditEvent = components['schemas']['ChargeAuditEvent']

export type ChargeHistoryResponse = components['schemas']['ChargeHistoryResponse']

export type ChargeReceiptUploadAuthorization = components['schemas']['ChargeReceiptUploadResponse']

export type ChargeReceiptDownload = components['schemas']['ChargeReceiptDownloadResponse']

export type FinancialMonthlyTotal = components['schemas']['FinancialMonthlyTotal']

export type FinancialUpcomingCharge = components['schemas']['FinancialUpcomingCharge']

export type FinancialSummary = components['schemas']['FinancialSummary']
