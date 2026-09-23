import { Box, Stack } from '@mui/material'
import { getTranslations } from 'next-intl/server'

import { DashboardPageHeader } from '@shared/components/layout'

import {
  financialEntries,
  financialKpis,
  monthlyFinancialMovement,
  upcomingDues,
} from '../data/financial-entries'
import { FinancialDashboardHeaderActions } from './FinancialDashboardHeaderActions'
import { FinancialEntriesTable } from './FinancialEntriesTable'
import { FinancialKpiCards } from './FinancialKpiCards'
import { FinancialMovementChart } from './FinancialMovementChart'
import { FinancialUpcomingDueList } from './FinancialUpcomingDueList'

export async function FinancialDashboardPage() {
  const t = await getTranslations('dashboard.finance')

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={<FinancialDashboardHeaderActions exportLabel={t('export')} />}
        />

        <FinancialKpiCards kpis={financialKpis} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.55fr) minmax(320px, 0.95fr)' },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <FinancialMovementChart movement={monthlyFinancialMovement} />
          <FinancialUpcomingDueList items={upcomingDues} />
        </Box>
        <FinancialEntriesTable entries={financialEntries} />
      </Stack>
    </Box>
  )
}
