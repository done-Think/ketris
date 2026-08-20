import { Box, Stack, Typography } from '@mui/material'

import { financialEntries, monthlyFinancialMovement } from '../data/financial-entries'
import { FinancialEntriesTable } from './FinancialEntriesTable'
import { FinancialMovementChart } from './FinancialMovementChart'

export function FinancialDashboardPage() {
  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <Box>
          <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 900 }}>
            Financeiro
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15, md: 17 } }}>
            Movimentação financeira mensal e registros de venda/comissão.
          </Typography>
        </Box>

        <FinancialMovementChart movement={monthlyFinancialMovement} />
        <FinancialEntriesTable entries={financialEntries} />
      </Stack>
    </Box>
  )
}
