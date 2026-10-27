'use client'

import { Box, Typography, useMediaQuery } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import { LineChart } from '@mui/x-charts/LineChart'
import { useTranslations } from 'next-intl'

import { brand } from '@shared/theme/tokens'

import type { GrowthTrendPoint } from '../types/platform-overview'
import { styles, getLineChartStyles } from '../styles/platform-growth-chart.styles'

export function PlatformGrowthChart({ trend }: { trend: readonly GrowthTrendPoint[] }) {
  const t = useTranslations('platform.overview')
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
  const chartHeight = isMobile ? 270 : 300

  return (
    <Box component="section" aria-labelledby="growth-trends-title" sx={styles.panel}>
      <Typography id="growth-trends-title" sx={styles.title}>
        {t('growth.title')}
      </Typography>
      <Box sx={styles.box}>
        <LineChart
          dataset={[...trend]}
          xAxis={[
            {
              dataKey: 'month',
              scaleType: 'point',
              tickLabelInterval: (_, index) => !isMobile || index % 2 === 0,
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
          height={chartHeight}
          margin={{ top: 28, right: isMobile ? 8 : 18, bottom: 36, left: 8 }}
          grid={{ horizontal: true }}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'top', horizontal: isMobile ? 'middle' : 'right' },
              labelStyle: { fontSize: 12, fill: brand.neutral[500] },
            },
          }}
          sx={getLineChartStyles({ isMobile })}
        />
      </Box>
    </Box>
  )
}
