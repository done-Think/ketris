import { Box } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'

import { alpha, brand } from '@shared/theme/tokens'

import { dashboardPerformance } from '../data/dashboard-overview'

export function DashboardPerformanceChart() {
  return (
    <Box sx={{ flex: 1, mt: 1.2, minHeight: { xs: 230, md: 270 }, overflow: 'hidden' }}>
      <LineChart
        dataset={dashboardPerformance}
        xAxis={[{ scaleType: 'point', dataKey: 'month' }]}
        yAxis={[{ min: 0 }]}
        series={[
          {
            dataKey: 'value',
            label: 'Faturamento',
            color: brand.magenta[500],
            curve: 'linear',
            showMark: true,
            valueFormatter: (value) => `R$ ${((value ?? 0) / 10).toFixed(1)}M`,
            area: true,
          },
        ]}
        height={270}
        margin={{ left: 28, right: 16, top: 20, bottom: 30 }}
        grid={{ horizontal: true }}
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
  )
}
