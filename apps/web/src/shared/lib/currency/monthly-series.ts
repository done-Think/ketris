import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { MonthlyMovement, MonthlyTotal } from '@shared/types/monthly-series'

import { convertFinancialAmount, type FinancialExchangeRate } from './display-currency'

export function mapMonthlySeriesToMovement(
  series: MonthlyTotal[],
  locale: AppLocale = defaultLocale,
  exchangeRate?: FinancialExchangeRate | null,
): MonthlyMovement[] {
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
