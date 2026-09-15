'use client'

import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { financialKpiToneStyles } from '../config/financial-status-styles'
import type { FinancialKpiCardsProps } from '../types/financial-entry'

export function FinancialKpiCards({ kpis }: FinancialKpiCardsProps) {
  const t = useTranslations('dashboard.finance.kpis')

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, 1fr)' },
        gap: 1.8,
      }}
    >
      {kpis.map((kpi) => {
        const tone = financialKpiToneStyles[kpi.tone]

        return (
          <Box
            key={kpi.id}
            sx={{
              bgcolor: surface.paper,
              border: '1px solid',
              borderColor: alpha.graphite[6],
              borderRadius: `${radius.sm}px`,
              boxShadow: shadows.crmCard,
              minHeight: 132,
              p: 2,
            }}
          >
            <Stack spacing={1.2}>
              <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 800 }}>
                {t(kpi.labelKey)}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 28, fontWeight: 900 }}>
                {kpi.value}
              </Typography>
              <Typography sx={{ color: tone.color, fontSize: 12, fontWeight: 900 }}>
                {kpi.helper}
              </Typography>
            </Stack>
          </Box>
        )
      })}
    </Box>
  )
}
