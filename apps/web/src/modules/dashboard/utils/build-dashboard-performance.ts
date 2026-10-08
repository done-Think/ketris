import type { FinancialMonthlyTotal } from '@modules/financial/types/service'

import type { DashboardPerformancePoint } from '../types/dashboard-overview'

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

export function buildDashboardPerformance(
  series: FinancialMonthlyTotal[],
): DashboardPerformancePoint[] {
  return [...series]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .slice(-6)
    .map((entry) => ({
      month: monthAbbreviations[entry.month - 1] ?? String(entry.month),
      value: entry.total,
    }))
}
