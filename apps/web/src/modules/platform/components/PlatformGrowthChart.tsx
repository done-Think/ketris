'use client'

import { Box, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { GrowthTrendPoint } from '../types/platform-overview'

export function PlatformGrowthChart({ trend }: { trend: readonly GrowthTrendPoint[] }) {
  const t = useTranslations('platform.overview')

  return (
    <Box component="section" aria-labelledby="growth-trends-title" sx={panelSx}>
      <Typography id="growth-trends-title" sx={titleSx}>
        {t('growth.title')}
      </Typography>
      <Box sx={{ height: { xs: 300, lg: 340 }, width: '100%' }}>
        <LineChart
          dataset={[...trend]}
          xAxis={[
            {
              dataKey: 'month',
              scaleType: 'point',
              valueFormatter: (value) => t(`months.${value}`),
            },
          ]}
          yAxis={[{ disableLine: true, disableTicks: true }]}
          series={[
            {
              dataKey: 'tenants',
              label: t('growth.tenants'),
              color: brand.magenta[500],
              showMark: false,
            },
            {
              dataKey: 'contracts',
              label: t('growth.contracts'),
              color: brand.semantic.info,
              showMark: false,
            },
          ]}
          height={300}
          margin={{ top: 28, right: 18, bottom: 36, left: 14 }}
          grid={{ horizontal: true }}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'top', horizontal: 'right' },
              labelStyle: { fontSize: 12, fill: brand.neutral[500] },
            },
          }}
          sx={{
            '& .MuiChartsAxis-left': { display: 'none' },
            '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
              fill: brand.neutral[500],
              fontSize: 12,
            },
            '& .MuiChartsGrid-line': { stroke: alpha.graphite[8] },
          }}
        />
      </Box>
    </Box>
  )
}

const panelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.md}px`,
  boxShadow: shadows.crmCard,
  minWidth: 0,
  minHeight: { lg: 400 },
  p: { xs: 2, md: 2.75 },
}
const titleSx = { color: brand.graphite[500], fontSize: 16, fontWeight: 900, mb: 1 }
