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
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        },
        gap: { xs: 0.8, sm: 1.4, xl: 1.8 },
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
              minHeight: { xs: 116, sm: 132 },
              minWidth: 0,
              overflow: 'hidden',
              p: { xs: 1.4, sm: 2 },
            }}
          >
            <Stack spacing={{ xs: 0.8, sm: 1.2 }} sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{ color: brand.neutral[500], fontSize: { xs: 11, sm: 13 }, fontWeight: 800 }}
              >
                {t(kpi.labelKey)}
              </Typography>
              <Typography
                noWrap
                sx={{ color: brand.graphite[500], fontSize: { xs: 23, sm: 28 }, fontWeight: 900 }}
              >
                {kpi.value}
              </Typography>
              <Typography
                noWrap
                sx={{ color: tone.color, fontSize: { xs: 11, sm: 12 }, fontWeight: 900 }}
              >
                {kpi.helper}
              </Typography>
            </Stack>
          </Box>
        )
      })}
    </Box>
  )
}
