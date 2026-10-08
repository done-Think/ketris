'use client'

import { Box, Stack, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { useTranslations } from 'next-intl'

import { DashboardPanel } from '@modules/dashboard/components/DashboardPanel'
import { formatCurrency } from '@shared/lib/utils/format'
import { alpha, brand } from '@shared/theme/tokens'

import type { AgencyRevenuePerformancePanelProps } from '../types/agency-overview'

export function AgencyRevenuePerformancePanel({
  revenuePoints,
}: AgencyRevenuePerformancePanelProps) {
  const t = useTranslations('dashboard.agencyOverview.performance')
  const chartDataset = [...revenuePoints]

  return (
    <DashboardPanel>
      <Box sx={{ minWidth: 0, p: { xs: 2, md: 2.4 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1.2}
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
              {t('title')}
            </Typography>
            <Typography sx={{ color: brand.neutral[500], fontSize: 11.5, fontWeight: 700 }}>
              {t('subtitle')}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.4} sx={{ color: brand.neutral[500], fontSize: 11 }}>
            <LegendDot color={brand.magenta[500]} label={t('revenue')} />
          </Stack>
        </Stack>

        <Box sx={{ minHeight: { xs: 230, md: 270 }, overflow: 'hidden' }}>
          <LineChart
            dataset={chartDataset}
            xAxis={[{ scaleType: 'point', dataKey: 'month' }]}
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
            margin={{ left: 28, right: 16, top: 20, bottom: 30 }}
            grid={{ horizontal: true, vertical: true }}
            slotProps={{ legend: { hidden: true } }}
            sx={{
              '& .MuiAreaElement-root': {
                fill: brand.magenta[500],
                fillOpacity: 0.08,
              },
              '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': {
                stroke: 'transparent',
              },
              '& .MuiChartsAxis-tickLabel': {
                fill: brand.neutral[500],
                fontSize: 11,
                fontWeight: 700,
              },
              '& .MuiChartsGrid-line': {
                stroke: alpha.graphite[6],
              },
            }}
          />
        </Box>
      </Box>
    </DashboardPanel>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Stack component="span" direction="row" alignItems="center" spacing={0.6}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color }} />
      <Box component="span">{label}</Box>
    </Stack>
  )
}
