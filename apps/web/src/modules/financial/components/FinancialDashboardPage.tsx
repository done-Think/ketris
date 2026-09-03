import { Box, Stack, Typography } from '@mui/material'
import { getTranslations } from 'next-intl/server'

import { financialEntries, monthlyFinancialMovement } from '../data/financial-entries'
import { FinancialEntriesTable } from './FinancialEntriesTable'
import { FinancialMovementChart } from './FinancialMovementChart'

export async function FinancialDashboardPage() {
  const t = await getTranslations('dashboard.finance')

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <Box>
          <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 900 }}>
            {t('title')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15, md: 17 } }}>
            {t('subtitle')}
          </Typography>
        </Box>

        <FinancialMovementChart movement={monthlyFinancialMovement} />
        <FinancialEntriesTable entries={financialEntries} />
      </Stack>
    </Box>
  )
}
