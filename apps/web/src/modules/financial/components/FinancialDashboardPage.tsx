import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { Box, Button, Stack, Typography } from '@mui/material'
import { getTranslations } from 'next-intl/server'

import { brand, iconSize, radius } from '@shared/theme/tokens'

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

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
          justifyContent="space-between"
          spacing={1.6}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{ color: brand.graphite[500], fontSize: { xs: 30, md: 40 }, fontWeight: 900 }}
            >
              {t('title')}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
            <Button
              type="button"
              variant="outlined"
              endIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: iconSize.sm }} />}
              sx={{ borderRadius: `${radius.sm}px`, fontWeight: 900, minHeight: 40 }}
            >
              {t('selectedMonth')}
            </Button>
            <Button
              type="button"
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
              sx={{ borderRadius: `${radius.sm}px`, fontWeight: 900, minHeight: 40 }}
            >
              {t('export')}
            </Button>
          </Stack>
        </Stack>

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
