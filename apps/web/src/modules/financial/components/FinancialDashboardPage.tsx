'use client'

import { Box, Stack } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import { DashboardPageHeader } from '@shared/components/layout'

import { useCharges, useExportCharges, useFinancialSummary } from '../hooks/use-financial'
import { useFinancialError } from '../hooks/use-financial-error'
import { useFinancialFormat } from '../hooks/use-financial-format'
import { styles } from '../styles/financial-dashboard-page.styles'
import {
  mapChargeListItemToFinancialEntry,
  mapFinancialSummaryToKpis,
  mapMonthlySeriesToMovement,
  mapUpcomingChargesToDues,
} from '../utils/financial-summary-adapter'
import { monthKey, recentMonths } from '../utils/month'
import { FinancialDashboardHeaderActions } from './FinancialDashboardHeaderActions'
import { FinancialEntriesTable } from './FinancialEntriesTable'
import { FinancialKpiCards } from './FinancialKpiCards'
import { FinancialMovementChart } from './FinancialMovementChart'
import { FinancialUpcomingDueList } from './FinancialUpcomingDueList'

const monthOptions = recentMonths(new Date(), 12)

export function FinancialDashboardPage() {
  const t = useTranslations('dashboard.finance')
  const locale = useLocale()
  const router = useRouter()
  const format = useFinancialFormat()
  const errorMessage = useFinancialError()
  const { enqueueSnackbar } = useSnackbar()
  const [month, setMonth] = useState(() => monthKey(new Date()))
  const summary = useFinancialSummary(month).data
  const entries = useCharges({ dueMonth: month, pageSize: 8 }).data?.items ?? []
  const exportCharges = useExportCharges()
  const openCharge = (id: string) =>
    router.push({ pathname: '/dashboard/finance/charges/[id]', params: { id } })

  return (
    <Box sx={styles.page}>
      <Stack spacing={2.4}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            <FinancialDashboardHeaderActions
              month={month}
              months={monthOptions}
              exporting={exportCharges.isPending}
              onMonthChange={setMonth}
              onExport={() =>
                exportCharges.mutate(
                  { month, locale },
                  {
                    onError: (error) =>
                      enqueueSnackbar(errorMessage(error, 'exportFailed'), { variant: 'error' }),
                  },
                )
              }
            />
          }
        />
        <FinancialKpiCards
          kpis={mapFinancialSummaryToKpis(summary, format.currency, format.percent)}
        />
        <Box sx={styles.grid}>
          <FinancialMovementChart
            movement={mapMonthlySeriesToMovement(summary?.monthlySeries ?? [], format.shortMonth)}
          />
          <FinancialUpcomingDueList
            items={mapUpcomingChargesToDues(summary?.upcomingDues ?? [])}
            onOpen={openCharge}
          />
        </Box>
        <FinancialEntriesTable
          entries={entries.map(mapChargeListItemToFinancialEntry)}
          onOpen={openCharge}
        />
      </Stack>
    </Box>
  )
}
