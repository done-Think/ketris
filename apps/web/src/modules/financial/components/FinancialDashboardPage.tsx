import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { Box, Button, Stack } from '@mui/material'
import { getTranslations } from 'next-intl/server'

import {
  DashboardNotificationsButton,
  DashboardPageHeader,
  dashboardHeaderActionButtonSx,
} from '@shared/components/layout'
import { iconSize } from '@shared/theme/tokens'

import {
  financialEntries,
  financialKpis,
  monthlyFinancialMovement,
  upcomingDues,
} from '../data/financial-entries'
import { FinancialEntriesTable } from './FinancialEntriesTable'
import { FinancialKpiCards } from './FinancialKpiCards'
import { FinancialMovementChart } from './FinancialMovementChart'
import { FinancialUpcomingDueList } from './FinancialUpcomingDueList'

export async function FinancialDashboardPage() {
  const t = await getTranslations('dashboard.finance')
  const actions = (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
      <Button
        type="button"
        variant="outlined"
        endIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: iconSize.sm }} />}
        sx={dashboardHeaderActionButtonSx}
      >
        {t('selectedMonth')}
      </Button>
      <Button
        type="button"
        variant="outlined"
        startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        sx={dashboardHeaderActionButtonSx}
      >
        {t('export')}
      </Button>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack spacing={2.4}>
        <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} actions={actions} />

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
