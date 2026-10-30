'use client'

import { formatCurrency } from '@shared/lib/utils/format'

import { Box, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { useFormatter, useTranslations } from 'next-intl'

import { brand } from '@shared/theme/tokens'

import type { FinancialMovementChartProps } from '../types/financial-entry'
import { styles } from '../styles/financial-movement-chart.styles'

export function FinancialMovementChart({ movement }: FinancialMovementChartProps) {
  const format = useFormatter()
  const t = useTranslations('dashboard.finance')
  const formatMoney = (value: number) =>
    formatCurrency(value, format.number, { maximumFractionDigits: 0 })

  return (
    <Box sx={styles.card}>
      <Typography sx={styles.title}>{t('revenueChartTitle')}</Typography>
      <Box sx={styles.chart}>
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
              valueFormatter: (value) => formatMoney(value ?? 0),
            },
          ]}
          margin={{ left: 12, right: 12, top: 24, bottom: 28 }}
          grid={{ horizontal: false, vertical: false }}
          sx={styles.barChart}
        />
      </Box>
    </Box>
  )
}
