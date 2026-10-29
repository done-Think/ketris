import type { ChargeStatus, StoredChargeStatus } from '../types/charge'

const openStatuses: readonly StoredChargeStatus[] = ['PENDING', 'SCHEDULED']

export function isOpenChargeStatus(status: StoredChargeStatus): boolean {
  return openStatuses.includes(status)
}

export function effectiveChargeStatus(
  status: StoredChargeStatus,
  dueDate: Date,
  today: Date,
): ChargeStatus {
  return isOpenChargeStatus(status) && dueDate.getTime() < today.getTime() ? 'OVERDUE' : status
}

export function withEffectiveStatus<T extends { storedStatus: StoredChargeStatus; dueDate: Date }>(
  item: T,
  today: Date,
): T & { status: ChargeStatus } {
  return { ...item, status: effectiveChargeStatus(item.storedStatus, item.dueDate, today) }
}
