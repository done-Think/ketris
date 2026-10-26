'use client'

import { Box, Stack, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { useFormatter, useTranslations } from 'next-intl'

import { DashboardPanel } from '@shared/components/ui/DashboardPanel'
import { brand } from '@shared/theme/tokens'

import type { AgencyRevenuePerformancePanelProps } from '../types/agency-overview'
import { styles } from '../styles/agency-revenue-performance-panel.styles'
import { ChartLegendDot } from './ChartLegendDot'

export function AgencyRevenuePerformancePanel({
  revenuePoints,
  currency = 'BRL',
}: AgencyRevenuePerformancePanelProps) {
  const t = useTranslations('dashboard.agencyOverview.performance')
  const format = useFormatter()
  const formatCurrency = (value: number) => format.number(value, { style: 'currency', currency })
  const chartDataset = [...revenuePoints]

  return (
    <DashboardPanel>
      <Box sx={styles.box}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1.2}
          sx={styles.stack}
        >
          <Box>
            <Typography sx={styles.typography}>{t('title')}</Typography>
            <Typography sx={styles.typography2}>{t('subtitle')}</Typography>
          </Box>
          <Stack direction="row" spacing={1.4} sx={styles.stack2}>
            <ChartLegendDot color={brand.magenta[500]} label={t('revenue')} />
          </Stack>
        </Stack>

        <Box sx={styles.box2}>
          <LineChart
            dataset={chartDataset}
            xAxis={[{ scaleType: 'point', dataKey: 'month' }]}
            yAxis={[
              {
                valueFormatter: (value: number) =>
                  format.number(value, { notation: 'compact', maximumFractionDigits: 1 }),
              },
            ]}
            series={[
              {
                dataKey: 'revenue',
                label: t('revenue'),
                color: brand.magenta[500],
                curve: 'linear',
                showMark: false,
                area: true,
                valueFormatter: (value) => formatCurrency(value ?? 0),
              },
            ]}
            height={270}
            margin={{ left: 48, right: 16, top: 20, bottom: 30 }}
            grid={{ horizontal: true, vertical: true }}
            slotProps={{ legend: { hidden: true } }}
            sx={styles.lineChart}
          />
        </Box>
      </Box>
    </DashboardPanel>
  )
}
