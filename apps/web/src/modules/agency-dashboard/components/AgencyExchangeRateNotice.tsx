'use client'

import { Typography } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'

import type { AgencyExchangeRateNoticeProps } from '../types/agency-overview'

// Money is stored in BRL; outside pt-BR it is shown in the locale's currency, so the rate used
// (or why it is missing) is stated next to the numbers.
export function AgencyExchangeRateNotice({
  targetCurrency,
  exchangeRate,
  isPending,
}: AgencyExchangeRateNoticeProps) {
  const locale = useLocale()
  const t = useTranslations('dashboard.finance')

  if (targetCurrency === 'BRL') return null

  return (
    <Typography variant="caption" color="text.secondary">
      {exchangeRate
        ? t('exchangeRateNotice', {
            currency: targetCurrency,
            rate: new Intl.NumberFormat(locale, { maximumFractionDigits: 5 }).format(
              exchangeRate.brlPerUnit,
            ),
            date: new Intl.DateTimeFormat(locale, { timeZone: 'UTC' }).format(
              new Date(`${exchangeRate.date}T00:00:00Z`),
            ),
          })
        : t(isPending ? 'exchangeRateLoading' : 'exchangeRateUnavailable')}
    </Typography>
  )
}
