'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'

import { useFinancialExchangeRate } from '@shared/hooks/use-financial-exchange-rate'
import { targetCurrencyForLocale } from '@shared/lib/currency/display-currency'
import type { AppLocale } from '@/i18n/types/locale.types'

import { mapAgencyOverviewToUi } from '../utils/agency-overview-adapter'
import { useAgencyOverview } from './use-agency-dashboard'

// Agency-wide data of the dashboard (KPIs, revenue, top brokers, team activity), only for the
// agency's owners and admins: with `enabled` false nothing is requested (the API answers 403).
export function useAgencyOverviewUi(tenantId: string | null | undefined, enabled: boolean) {
  const locale = useLocale() as AppLocale
  const overviewQuery = useAgencyOverview(enabled ? tenantId : null)
  const exchangeRateQuery = useFinancialExchangeRate(locale)
  const exchangeRate = exchangeRateQuery.data
  const targetCurrency = targetCurrencyForLocale(locale)

  const overview = useMemo(
    () =>
      overviewQuery.data ? mapAgencyOverviewToUi(overviewQuery.data, locale, exchangeRate) : null,
    [overviewQuery.data, locale, exchangeRate],
  )

  return {
    overview,
    exchangeRate,
    isExchangeRatePending: exchangeRateQuery.isPending,
    targetCurrency,
    displayCurrency: exchangeRate ? targetCurrency : ('BRL' as const),
  }
}
