import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { Box, Button, Stack } from '@mui/material'
import { getTranslations } from 'next-intl/server'

import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'
import { iconSize, radius } from '@shared/theme/tokens'

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
        sx={{
          borderRadius: `${radius.sm}px`,
          fontSize: 12,
          fontWeight: 500,
          height: { xs: 40, sm: 32 },
          px: 1.25,
        }}
      >
        {t('selectedMonth')}
      </Button>
      <Button
        type="button"
        variant="outlined"
        startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        sx={{
          borderRadius: `${radius.sm}px`,
          fontSize: 12,
          fontWeight: 500,
          height: { xs: 40, sm: 32 },
          px: 1.25,
        }}
      >
        {t('export')}
      </Button>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
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
