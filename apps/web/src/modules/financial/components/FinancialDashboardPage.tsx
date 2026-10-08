'use client'

import { useMemo } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import { DashboardPageHeader } from '@shared/components/layout'

import { useCharges, useFinancialSummary } from '../hooks/use-financial'
import { useFinancialExchangeRate } from '../hooks/use-financial-exchange-rate'
import { targetCurrencyForLocale } from '../utils/financial-display-currency'
import {
  mapChargeListItemToFinancialEntry,
  mapFinancialSummaryToKpis,
  mapMonthlySeriesToMovement,
  mapUpcomingChargesToDues,
} from '../utils/financial-summary-adapter'
import { FinancialDashboardHeaderActions } from './FinancialDashboardHeaderActions'
import { FinancialEntriesTable } from './FinancialEntriesTable'
import { FinancialKpiCards } from './FinancialKpiCards'
import { FinancialMovementChart } from './FinancialMovementChart'
import { FinancialUpcomingDueList } from './FinancialUpcomingDueList'

export function FinancialDashboardPage() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('dashboard.finance')
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const summaryQuery = useFinancialSummary(tenantId)
  const chargesQuery = useCharges(tenantId, { pageSize: 8 })
  const exchangeRateQuery = useFinancialExchangeRate(locale)
  const exchangeRate = exchangeRateQuery.data
  const targetCurrency = targetCurrencyForLocale(locale)
  const kpis = useMemo(
    () => mapFinancialSummaryToKpis(summaryQuery.data, locale, exchangeRate),
    [summaryQuery.data, locale, exchangeRate],
  )
  const movement = useMemo(
    () => mapMonthlySeriesToMovement(summaryQuery.data?.monthlySeries ?? [], locale, exchangeRate),
    [summaryQuery.data, locale, exchangeRate],
  )
  const upcomingDues = useMemo(
    () => mapUpcomingChargesToDues(summaryQuery.data?.upcomingDues ?? [], locale),
    [summaryQuery.data, locale],
  )
  const entries = useMemo(
    () => (chargesQuery.data?.items ?? []).map(mapChargeListItemToFinancialEntry),
    [chargesQuery.data],
  )

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack spacing={2.4}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={<FinancialDashboardHeaderActions exportLabel={t('export')} />}
        />

        {targetCurrency !== 'BRL' && (
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
              : t(exchangeRateQuery.isPending ? 'exchangeRateLoading' : 'exchangeRateUnavailable')}
          </Typography>
        )}

        <FinancialKpiCards kpis={kpis} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.55fr) minmax(320px, 0.95fr)' },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <FinancialMovementChart movement={movement} currency={exchangeRate?.currency ?? 'BRL'} />
          <FinancialUpcomingDueList items={upcomingDues} exchangeRate={exchangeRate} />
        </Box>
        <FinancialEntriesTable entries={entries} exchangeRate={exchangeRate} />
      </Stack>
    </Box>
  )
}
