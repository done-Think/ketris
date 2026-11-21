import type {
  ChargeListRow,
  ChargeStatus,
  ContractChargeMonth,
  ContractChargeMonthStatus,
  ContractChargeOverview,
} from '../types/charge'

const openStatuses: readonly ChargeStatus[] = ['pending', 'scheduled', 'overdue']
export const contractChargeDueSoonDays = 3

const sumAmounts = (charges: ChargeListRow[]) =>
  charges.reduce((total, charge) => total + charge.amount, 0)

export function calendarDayKey(date: Date, offsetDays = 0): string {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays)
  return [
    day.getFullYear(),
    String(day.getMonth() + 1).padStart(2, '0'),
    String(day.getDate()).padStart(2, '0'),
  ].join('-')
}

function monthStatus(charges: ChargeListRow[]): ContractChargeMonthStatus {
  const active = charges.filter((charge) => charge.status !== 'cancelled')
  if (!active.length) return 'cancelled'
  if (active.some((charge) => charge.status === 'overdue')) return 'overdue'
  if (active.every((charge) => charge.status === 'paid')) return 'paid'
  return 'upcoming'
}

export function groupContractChargesByMonth(charges: ChargeListRow[]): ContractChargeMonth[] {
  const months = new Map<string, ChargeListRow[]>()
  for (const charge of [...charges].sort((a, b) => a.dueDate.localeCompare(b.dueDate))) {
    const month = charge.dueDate.slice(0, 7)
    months.set(month, [...(months.get(month) ?? []), charge])
  }

  return [...months]
    .map(([month, items]) => ({
      month,
      charges: items,
      total: sumAmounts(items.filter((charge) => charge.status !== 'cancelled')),
      status: monthStatus(items),
    }))
    .reverse()
}

export function summarizeContractCharges(
  charges: ChargeListRow[],
  today: Date,
): ContractChargeOverview {
  const todayKey = calendarDayKey(today)
  const dueSoonLimit = calendarDayKey(today, contractChargeDueSoonDays)
  const open = charges
    .filter((charge) => openStatuses.includes(charge.status))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const overdue = open.filter((charge) => charge.status === 'overdue')
  const upcoming = open.filter(
    (charge) => charge.status !== 'overdue' && charge.dueDate >= todayKey,
  )
  const dueSoon = upcoming.filter((charge) => charge.dueDate <= dueSoonLimit)

  return {
    openCount: open.length,
    openTotal: sumAmounts(open),
    overdue,
    overdueTotal: sumAmounts(overdue),
    nextDue: upcoming[0] ?? null,
    dueSoon,
    dueSoonTotal: sumAmounts(dueSoon),
  }
}
