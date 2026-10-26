'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useLocale } from 'next-intl'
import { useCallback } from 'react'

import type { AppLocale } from '@/i18n/types/locale.types'
import { useFinancialExchangeRate } from '@shared/hooks/use-financial-exchange-rate'
import { targetCurrencyForLocale } from '@shared/lib/currency/display-currency'

import { dashboardQueryKeys } from '../config/dashboard-query-keys'
import { dashboardService } from '../services/dashboard-service'
import type { ApiAgencyOverview } from '../types/agency-service'
import { mapAgencyOverviewToUi } from '../utils/agency-overview-adapter'

export function useAgencyOverview(enabled: boolean) {
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const locale = useLocale() as AppLocale
  const exchangeRateQuery = useFinancialExchangeRate(locale)
  const exchangeRate = exchangeRateQuery.data
  const targetCurrency = targetCurrencyForLocale(locale)
  const select = useCallback(
    (overview: ApiAgencyOverview) => mapAgencyOverviewToUi(overview, locale, exchangeRate),
    [locale, exchangeRate],
  )
  const overviewQuery = useQuery({
    queryKey: dashboardQueryKeys.agencyOverview(tenantId ?? ''),
    queryFn: () => dashboardService.getAgencyOverview(),
    select,
    enabled: enabled && Boolean(tenantId),
  })

  return {
    overview: overviewQuery.data ?? null,
    exchangeRate,
    isExchangeRatePending: exchangeRateQuery.isPending,
    targetCurrency,
    displayCurrency: exchangeRate ? targetCurrency : ('BRL' as const),
  }
}
