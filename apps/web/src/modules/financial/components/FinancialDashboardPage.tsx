'use client'

import { useMemo } from 'react'
import { Box, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { DashboardPageHeader } from '@shared/components/layout'

import { useCharges, useFinancialSummary } from '../hooks/use-financial'
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
  const t = useTranslations('dashboard.finance')
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const summaryQuery = useFinancialSummary(tenantId)
  const chargesQuery = useCharges(tenantId, { pageSize: 8 })
  const kpis = useMemo(() => mapFinancialSummaryToKpis(summaryQuery.data), [summaryQuery.data])
  const movement = useMemo(
    () => mapMonthlySeriesToMovement(summaryQuery.data?.monthlySeries ?? []),
    [summaryQuery.data],
  )
  const upcomingDues = useMemo(
    () => mapUpcomingChargesToDues(summaryQuery.data?.upcomingDues ?? []),
    [summaryQuery.data],
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

        <FinancialKpiCards kpis={kpis} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.55fr) minmax(320px, 0.95fr)' },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <FinancialMovementChart movement={movement} />
          <FinancialUpcomingDueList items={upcomingDues} />
        </Box>
        <FinancialEntriesTable entries={entries} />
      </Stack>
    </Box>
  )
}
