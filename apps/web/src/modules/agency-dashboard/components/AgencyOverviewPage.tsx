'use client'

import { useMemo } from 'react'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'

import { useFinancialExchangeRate } from '@modules/financial/hooks/use-financial-exchange-rate'
import { targetCurrencyForLocale } from '@modules/financial/utils/financial-display-currency'
import {
  DashboardHeaderActionButton,
  DashboardMonthSelector,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'
import { iconSize, surface } from '@shared/theme/tokens'
import type { AppLocale } from '@/i18n/types/locale.types'

import { useAgencyOverview } from '../hooks/use-agency-dashboard'
import { mapAgencyOverviewToUi } from '../utils/agency-overview-adapter'
import { AgencyOverviewKpiGrid } from './AgencyOverviewKpiGrid'
import { AgencyRecentActivityPanel } from './AgencyRecentActivityPanel'
import { AgencyRevenuePerformancePanel } from './AgencyRevenuePerformancePanel'
import { AgencyTopBrokersPanel } from './AgencyTopBrokersPanel'

export function AgencyOverviewPage() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('dashboard.agencyOverview')
  const tFinance = useTranslations('dashboard.finance')
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const overviewQuery = useAgencyOverview(tenantId)
  const exchangeRateQuery = useFinancialExchangeRate(locale)
  const exchangeRate = exchangeRateQuery.data
  const targetCurrency = targetCurrencyForLocale(locale)
  const displayCurrency = exchangeRate ? targetCurrency : 'BRL'
  const overview = useMemo(
    () =>
      overviewQuery.data ? mapAgencyOverviewToUi(overviewQuery.data, locale, exchangeRate) : null,
    [overviewQuery.data, locale, exchangeRate],
  )

  const actions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.2}
      sx={{ width: { xs: '100%', md: 'auto' }, alignItems: { sm: 'center' } }}
    >
      <DashboardMonthSelector />
      <DashboardHeaderActionButton
        startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
      >
        {t('report')}
      </DashboardHeaderActionButton>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <Box sx={{ width: '100%', p: 3.5, bgcolor: surface.app }}>
      <Stack spacing={2.4}>
        <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} actions={actions} />
        {targetCurrency !== 'BRL' && (
          <Typography variant="caption" color="text.secondary">
            {exchangeRate
              ? tFinance('exchangeRateNotice', {
                  currency: targetCurrency,
                  rate: new Intl.NumberFormat(locale, { maximumFractionDigits: 5 }).format(
                    exchangeRate.brlPerUnit,
                  ),
                  date: new Intl.DateTimeFormat(locale, { timeZone: 'UTC' }).format(
                    new Date(`${exchangeRate.date}T00:00:00Z`),
                  ),
                })
              : tFinance(
                  exchangeRateQuery.isPending ? 'exchangeRateLoading' : 'exchangeRateUnavailable',
                )}
          </Typography>
        )}
        <AgencyOverviewKpiGrid kpis={overview?.kpis ?? []} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(280px, 1fr)' },
            gap: 1.6,
            alignItems: 'stretch',
          }}
        >
          <AgencyRevenuePerformancePanel
            revenuePoints={overview?.revenuePoints ?? []}
            currency={displayCurrency}
          />
          <AgencyTopBrokersPanel topBrokers={overview?.topBrokers ?? []} />
        </Box>

        <AgencyRecentActivityPanel activities={overview?.activities ?? []} />
      </Stack>
    </Box>
  )
}
