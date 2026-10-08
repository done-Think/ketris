'use client'

import { useQuery } from '@tanstack/react-query'

import type { AppLocale } from '@/i18n/types/locale.types'

import {
  targetCurrencyForLocale,
  type FinancialExchangeRate,
} from '../utils/financial-display-currency'

export function useFinancialExchangeRate(locale: AppLocale) {
  const currency = targetCurrencyForLocale(locale)

  return useQuery({
    queryKey: ['financial', 'exchange-rate', currency],
    enabled: currency !== 'BRL',
    staleTime: 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<FinancialExchangeRate> => {
      const response = await fetch(`/api/financial/exchange-rate?currency=${currency}`)
      if (!response.ok) throw new Error('Exchange rate unavailable')
      const rate: FinancialExchangeRate = await response.json()
      if (
        rate.currency !== currency ||
        !Number.isFinite(rate.brlPerUnit) ||
        rate.brlPerUnit <= 0 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(rate.date)
      ) {
        throw new Error('Invalid exchange rate')
      }
      return rate
    },
  })
}
