'use client'

import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { FinancialKpiCardsProps } from '../types/financial-entry'
import { styles } from '../styles/financial-kpi-cards.styles'

export function FinancialKpiCards({ kpis }: FinancialKpiCardsProps) {
  const t = useTranslations('dashboard.finance.kpis')

  return (
    <Box sx={styles.grid}>
      {kpis.map((kpi) => {
        return (
          <Box key={kpi.id} sx={styles.card}>
            <Stack spacing={{ xs: 0.8, sm: 1.2 }} sx={styles.content}>
              <Typography noWrap sx={styles.label}>
                {t(kpi.labelKey)}
              </Typography>
              <Typography noWrap sx={styles.value}>
                {kpi.value}
              </Typography>
            </Stack>
          </Box>
        )
      })}
    </Box>
  )
}
