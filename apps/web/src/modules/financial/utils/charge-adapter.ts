import {
  apiStatusToUi,
  apiTypeToDirection,
  directionToApiType,
  newStatusToApi,
} from '../config/charge-status'
import { normalizeChargeHistoryFields } from './charge-history'
import type {
  Charge,
  ChargeFormValues,
  ChargeHistoryItem,
  ChargeListRow,
  ChargeStatusCounts,
} from '../types/charge'
import type {
  ApiCharge,
  ApiChargeAuditEvent,
  ApiChargeListItem,
  ApiChargeStatusCounts,
  CreateChargePayload,
  UpdateChargePayload,
} from '../types/service'

const dateOnly = (value: string) => value.slice(0, 10)

export function mapChargeListItemFromApi(item: ApiChargeListItem): ChargeListRow {
  return {
    id: item.id,
    code: item.code,
    contractId: item.contractId,
    direction: apiTypeToDirection[item.type],
    description: item.description,
    payer: item.payerName ?? item.description ?? '',
    property: item.propertyTitle ?? '',
    amount: item.amount,
    dueDate: dateOnly(item.dueDate),
    status: apiStatusToUi[item.status],
  }
}

export function mapChargeFromApi(charge: ApiCharge): Charge {
  const status = apiStatusToUi[charge.status]

  return {
    id: charge.id,
    code: charge.code,
    contractId: charge.contractId,
    direction: apiTypeToDirection[charge.type],
    description: charge.description,
    payer: charge.payerName ?? charge.description ?? '',
    property: charge.propertyTitle ?? '',
    amount: charge.amount,
    dueDate: dateOnly(charge.dueDate),
    status,
    competence: charge.dueDate.slice(0, 7),
    contractCode: charge.contractCode,
    payerEmail: charge.payerEmail,
    propertyAddress: charge.propertyAddress,
    open: !isLockedCharge({ status }),
    payment: charge.paidAt
      ? { date: dateOnly(charge.paidAt), method: charge.paymentMethod ?? '' }
      : null,
    cancellation:
      status === 'cancelled'
        ? { date: charge.cancelledAt, reason: charge.cancellationReason }
        : null,
    receipt: charge.receipt,
  }
}

export function mapStatusCountsFromApi(counts: ApiChargeStatusCounts): ChargeStatusCounts {
  return {
    all: counts.ALL,
    pending: counts.PENDING,
    overdue: counts.OVERDUE,
    paid: counts.PAID,
    scheduled: counts.SCHEDULED,
    cancelled: counts.CANCELED,
  }
}

export function mapHistoryEventFromApi(event: ApiChargeAuditEvent): ChargeHistoryItem {
  return {
    id: event.id,
    action: event.action,
    actorName: event.actorName,
    date: event.createdAt,
    reason: event.reason,
    changedFields: normalizeChargeHistoryFields(event.changedFields),
    receipt: event.receipt,
  }
}

export function buildCreateChargePayload(values: ChargeFormValues): CreateChargePayload {
  return {
    description: values.description.trim(),
    type: directionToApiType[values.direction],
    amount: values.amount,
    dueDate: values.dueDate,
    status: newStatusToApi[values.status],
  }
}

export function isLockedCharge(charge: Pick<ChargeListRow, 'status'>): boolean {
  return charge.status === 'paid' || charge.status === 'cancelled'
}

export function buildUpdateChargePayload(
  charge: ChargeListRow,
  values: ChargeFormValues,
): UpdateChargePayload {
  const description = values.description.trim() || null
  if (isLockedCharge(charge)) return { description }

  return {
    description,
    type: directionToApiType[values.direction],
    amount: values.amount,
    dueDate: values.dueDate,
  }
}

export function chargeToFormValues(charge: ChargeListRow | null): ChargeFormValues {
  return charge
    ? {
        description: charge.description ?? '',
        amount: charge.amount,
        dueDate: charge.dueDate,
        direction: charge.direction,
        status: charge.status === 'scheduled' ? 'scheduled' : 'pending',
      }
    : { description: '', amount: 0, dueDate: '', direction: 'receivable', status: 'pending' }
}
