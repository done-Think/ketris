import { formatDate } from '@shared/lib/utils/format'
import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

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
import {
  convertFinancialAmount,
  formatFinancialAmount,
  type FinancialExchangeRate,
} from './financial-display-currency'

const chargeStatusToEntryStatus: Record<ApiChargeStatus, FinancialEntryStatus> = {
  PENDENTE: 'Pendente',
  PAGA: 'Pago',
  ATRASADA: 'Atrasado',
  AGENDADA: 'Pendente',
  CANCELADA: 'Pendente',
}

function formatShortDueDate(value: string, locale: AppLocale) {
  const formatted = formatDate(value, 'DD/MMM', locale)
  return formatted.replace(/\/(\p{L})/u, (_match, letter: string) => `/${letter.toUpperCase()}`)
}

export function mapFinancialSummaryToKpis(
  summary: FinancialSummary | undefined,
  locale: AppLocale = defaultLocale,
  exchangeRate?: FinancialExchangeRate | null,
): FinancialKpi[] {
  if (!summary) return []

  return [
    {
      id: 'receivable',
      labelKey: 'receivable',
      value: formatFinancialAmount(summary.monthlyReceivable, locale, exchangeRate),
      helper: '',
      tone: 'info',
    },
    {
      id: 'delinquency',
      labelKey: 'delinquency',
      value: formatFinancialAmount(summary.overdueTotal, locale, exchangeRate),
      helper: '',
      tone: 'error',
    },
    {
      id: 'defaultRate',
      labelKey: 'defaultRate',
      value: `${new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(summary.defaultRatePercentage)}%`,
      helper: '',
      tone: 'warning',
    },
  ]
}

export function mapMonthlySeriesToMovement(
  series: FinancialMonthlyTotal[],
  locale: AppLocale = defaultLocale,
  exchangeRate?: FinancialExchangeRate | null,
): FinancialMonthlyMovement[] {
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    timeZone: 'UTC',
  })

  return series.map((entry) => ({
    month:
      entry.month >= 1 && entry.month <= 12
        ? monthFormatter
            .format(new Date(Date.UTC(entry.year, entry.month - 1, 1)))
            .replace(/\.$/, '')
        : String(entry.month),
    revenue: convertFinancialAmount(entry.total, locale, exchangeRate).amount,
  }))
}

export function mapUpcomingChargesToDues(
  items: FinancialUpcomingCharge[],
  locale: AppLocale = defaultLocale,
): FinancialUpcomingDue[] {
  return items.map((item) => ({
    id: item.id,
    propertyId: item.propertyId ?? '',
    property: item.propertyTitle ?? item.description ?? '—',
    contactId: '',
    client: item.payerName ?? item.description ?? '—',
    dueDate: formatShortDueDate(item.dueDate, locale),
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
