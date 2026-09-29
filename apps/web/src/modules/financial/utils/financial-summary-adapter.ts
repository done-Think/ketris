import { formatCurrency, formatDate } from '@shared/lib/utils/format'

import type {
  FinancialEntry,
  FinancialEntryStatus,
  FinancialKpi,
  FinancialMonthlyMovement,
  FinancialUpcomingDue,
} from '../types/financial-entry'
import type {
  ApiChargeListItem,
  ApiChargeStatus,
  FinancialMonthlyTotal,
  FinancialSummary,
  FinancialUpcomingCharge,
} from '../types/service'

const monthAbbreviations = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const chargeStatusToEntryStatus: Record<ApiChargeStatus, FinancialEntryStatus> = {
  PENDENTE: 'Pendente',
  PAGA: 'Pago',
  ATRASADA: 'Atrasado',
  AGENDADA: 'Pendente',
  CANCELADA: 'Pendente',
}

function formatShortDueDate(value: string) {
  const formatted = formatDate(value, 'DD/MMM')
  return formatted.replace(/\/(\p{L})/u, (_match, letter: string) => `/${letter.toUpperCase()}`)
}

export function mapFinancialSummaryToKpis(summary: FinancialSummary | undefined): FinancialKpi[] {
  if (!summary) return []

  return [
    {
      id: 'receivable',
      labelKey: 'receivable',
      value: formatCurrency(summary.monthlyReceivable),
      helper: '',
      tone: 'info',
    },
    {
      id: 'delinquency',
      labelKey: 'delinquency',
      value: formatCurrency(summary.overdueTotal),
      helper: '',
      tone: 'error',
    },
    {
      id: 'defaultRate',
      labelKey: 'defaultRate',
      value: `${summary.defaultRatePercentage.toFixed(1)}%`,
      helper: '',
      tone: 'warning',
    },
  ]
}

export function mapMonthlySeriesToMovement(
  series: FinancialMonthlyTotal[],
): FinancialMonthlyMovement[] {
  return series.map((entry) => ({
    month: monthAbbreviations[entry.month - 1] ?? String(entry.month),
    revenue: entry.total,
  }))
}

export function mapUpcomingChargesToDues(items: FinancialUpcomingCharge[]): FinancialUpcomingDue[] {
  return items.map((item) => ({
    id: item.id,
    propertyId: item.propertyId ?? '',
    property: item.propertyTitle ?? item.description ?? '—',
    contactId: '',
    client: item.payerName ?? item.description ?? '—',
    dueDate: formatShortDueDate(item.dueDate),
    amountValue: item.amount,
    status: chargeStatusToEntryStatus[item.status],
    history: [],
  }))
}

export function mapChargeListItemToFinancialEntry(item: ApiChargeListItem): FinancialEntry {
  return {
    id: item.id,
    propertyId: '',
    date: formatDate(item.dueDate),
    description: item.description ?? item.code,
    property: item.propertyTitle ?? '—',
    client: item.payerName ?? '—',
    contactId: '',
    amountValue: item.type === 'A_PAGAR' ? -item.amount : item.amount,
    status: chargeStatusToEntryStatus[item.status],
    receipts: [],
  }
}
