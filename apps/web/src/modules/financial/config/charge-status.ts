import type { TranslationKey } from '@/i18n/types/messages.types'
import { brand, supportColor } from '@shared/theme/tokens'

import type {
  ChargeDirection,
  ChargeStatus,
  ChargeStatusFilter,
  ChargeStatusStyle,
  NewChargeStatus,
} from '../types/charge'
import type { ApiChargeStatus, ApiChargeType, ApiNewChargeStatus } from '../types/service'

export const chargeStatusFilters: ChargeStatusFilter[] = [
  'all',
  'pending',
  'overdue',
  'paid',
  'scheduled',
  'cancelled',
]

export const newChargeStatuses: NewChargeStatus[] = ['pending', 'scheduled']

export const chargeDirections: ChargeDirection[] = ['receivable', 'payable']

export const apiStatusToUi: Record<ApiChargeStatus, ChargeStatus> = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  SCHEDULED: 'scheduled',
  CANCELED: 'cancelled',
}

export const uiStatusToApi: Record<ChargeStatus, ApiChargeStatus> = {
  pending: 'PENDING',
  paid: 'PAID',
  overdue: 'OVERDUE',
  scheduled: 'SCHEDULED',
  cancelled: 'CANCELED',
}

export const newStatusToApi: Record<NewChargeStatus, ApiNewChargeStatus> = {
  pending: 'PENDING',
  scheduled: 'SCHEDULED',
}

export const apiTypeToDirection: Record<ApiChargeType, ChargeDirection> = {
  RECEIVABLE: 'receivable',
  PAYABLE: 'payable',
}

export const directionToApiType: Record<ChargeDirection, ApiChargeType> = {
  receivable: 'RECEIVABLE',
  payable: 'PAYABLE',
}

export const chargeStatusStyles: Record<ChargeStatus, ChargeStatusStyle> = {
  paid: { bgcolor: supportColor.successSoft, color: brand.semantic.success },
  pending: { bgcolor: supportColor.warningSoft, color: brand.semantic.warning },
  overdue: { bgcolor: supportColor.errorSoft, color: brand.semantic.error },
  scheduled: { bgcolor: supportColor.infoSoft, color: brand.semantic.info },
  cancelled: { bgcolor: brand.neutral[100], color: brand.neutral[500] },
}

export const chargeErrorKeys: Record<string, TranslationKey<'charges.errors'>> = {
  CHARGE_NOT_FOUND: 'notFound',
  CHARGE_CONTRACT_NOT_FOUND: 'contractNotFound',
  CHARGE_ALREADY_SETTLED: 'alreadySettled',
  CHARGE_NOT_PAID: 'notPaid',
  CHARGE_LOCKED: 'locked',
  CHARGE_HAS_MOVEMENT: 'hasMovement',
  CHARGE_CONCURRENT_CHANGE: 'concurrentChange',
  CHARGE_RECEIPT_NOT_FOUND: 'receiptNotFound',
  CHARGE_RECEIPT_INVALID: 'receiptInvalid',
  CHARGE_RECEIPT_STORAGE_UNAVAILABLE: 'receiptUnavailable',
  CHARGE_RECEIPT_UPLOAD_EXPIRED: 'receiptExpired',
  CHARGE_RECEIPT_UPLOAD_INVALID: 'receiptExpired',
  VALIDATION_ERROR: 'validation',
  FORBIDDEN: 'forbidden',
}
