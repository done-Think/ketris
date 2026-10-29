import { apiStatusToUi } from '../config/charge-status'
import type { FinancialEntry, FinancialKpi, FinancialUpcomingDue } from '../types/financial-entry'
import type { ApiChargeListItem, FinancialSummary, FinancialUpcomingCharge } from '../types/service'

export function mapFinancialSummaryToKpis(
  summary: FinancialSummary | undefined,
  formatCurrency: (value: number) => string,
  formatPercent: (value: number) => string,
): FinancialKpi[] {
  if (!summary) return []

  return [
    {
      id: 'receivable',
      labelKey: 'receivable',
      value: formatCurrency(summary.monthlyReceivable),
      tone: 'info',
    },
    {
      id: 'delinquency',
      labelKey: 'delinquency',
      value: formatCurrency(summary.overdueTotal),
      tone: 'error',
    },
    {
      id: 'defaultRate',
      labelKey: 'defaultRate',
      value: formatPercent(summary.defaultRatePercentage),
      tone: 'warning',
    },
    {
      id: 'occupancyRate',
      labelKey: 'occupancyRate',
      value: formatPercent(summary.occupancyRatePercentage),
      tone: 'success',
    },
  ]
}

export function mapUpcomingChargesToDues(items: FinancialUpcomingCharge[]): FinancialUpcomingDue[] {
  return items.map((item) => ({
    id: item.id,
    property: item.propertyTitle ?? item.description ?? '—',
    client: item.payerName ?? item.description ?? '—',
    dueDate: item.dueDate.slice(0, 10),
    amountValue: item.amount,
    status: apiStatusToUi[item.status],
  }))
}

export function mapChargeListItemToFinancialEntry(item: ApiChargeListItem): FinancialEntry {
  return {
    id: item.id,
    date: item.dueDate.slice(0, 10),
    description: item.description ?? item.code,
    property: item.propertyTitle ?? '—',
    client: item.payerName ?? '—',
    amountValue: item.type === 'PAYABLE' ? -item.amount : item.amount,
    status: apiStatusToUi[item.status],
  }
}

export function mapMonthlySeriesToMovement(
  series: FinancialSummary['monthlySeries'],
  formatMonth: (year: number, month: number) => string,
) {
  return series.map((entry) => ({
    month: formatMonth(entry.year, entry.month),
    revenue: entry.total,
  }))
}
