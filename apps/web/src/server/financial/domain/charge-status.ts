import type { ChargeStatus, StoredChargeStatus } from '../types/charge'

export const openChargeStatuses = [
  'PENDING',
  'SCHEDULED',
] as const satisfies readonly StoredChargeStatus[]

export function isOpenChargeStatus(status: StoredChargeStatus): boolean {
  return (openChargeStatuses as readonly StoredChargeStatus[]).includes(status)
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
