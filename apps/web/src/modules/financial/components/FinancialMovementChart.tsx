'use client'

import { Box, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { useFormatter, useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { FinancialMovementChartProps } from '../types/financial-entry'

export function FinancialMovementChart({ movement }: FinancialMovementChartProps) {
  const format = useFormatter()
  const t = useTranslations('dashboard.finance')
  const formatCurrency = (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })

  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
        minWidth: 0,
        p: { xs: 2, md: 2.4 },
      }}
    >
      <Typography sx={{ color: brand.graphite[500], fontSize: 18, fontWeight: 900, mb: 2 }}>
        {t('revenueChartTitle')}
      </Typography>
      <Box sx={{ height: { xs: 260, md: 320 }, width: '100%' }}>
        <BarChart
          dataset={movement}
          xAxis={[
            {
              scaleType: 'band',
              dataKey: 'month',
            },
          ]}
          yAxis={[{ disableLine: true, disableTicks: true }]}
          series={[
            {
              dataKey: 'revenue',
              label: t('revenue'),
              color: brand.magenta[500],
              valueFormatter: (value) => formatCurrency(value ?? 0),
            },
          ]}
          height={300}
          margin={{ left: 12, right: 12, top: 24, bottom: 28 }}
          grid={{ horizontal: false, vertical: false }}
          sx={{
            '& .MuiChartsAxis-left': { display: 'none' },
            '& .MuiChartsLegend-root': { display: 'none' },
            '& .MuiBarElement-root': {
              rx: 5,
              ry: 5,
            },
          }}
        />
      </Box>
    </Box>
  )
}
