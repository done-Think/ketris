'use client'

import { Box, Stack, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { useTranslations } from 'next-intl'

import { DashboardPanel } from '@modules/dashboard/components/DashboardPanel'
import { alpha, brand } from '@shared/theme/tokens'

import { agencyRevenuePerformance } from '../data/agency-overview'

export function AgencyRevenuePerformancePanel() {
  const t = useTranslations('dashboard.agencyOverview.performance')
  const chartDataset = [...agencyRevenuePerformance]

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
            <LegendDot color={brand.graphite[500]} label={t('target')} />
          </Stack>
        </Stack>

        <Box sx={{ minHeight: { xs: 230, md: 270 }, overflow: 'hidden' }}>
          <LineChart
            dataset={chartDataset}
            xAxis={[{ scaleType: 'point', dataKey: 'month' }]}
            yAxis={[{ min: 60 }]}
            series={[
              {
                dataKey: 'revenue',
                label: t('revenue'),
                color: brand.magenta[500],
                curve: 'linear',
                showMark: false,
                area: true,
                valueFormatter: (value) => `R$ ${value ?? 0}k`,
              },
              {
                dataKey: 'target',
                label: t('target'),
                color: brand.graphite[500],
                curve: 'linear',
                showMark: false,
                valueFormatter: (value) => `R$ ${value ?? 0}k`,
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
              '& .MuiLineElement-root:nth-of-type(2)': {
                strokeDasharray: '4 4',
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
