import { Box, Paper, Stack, Typography } from '@mui/material'

import { brand } from '@shared/theme/tokens'

import { ownerWeeklyPerformance } from '../fixtures/owner-dashboard-fixtures'
import { ownerDashboardPanelSx } from './owner-dashboard.styles'

export function WeeklyPerformanceCard() {
  const maxValue = Math.max(...ownerWeeklyPerformance.points)
  const minValue = Math.min(...ownerWeeklyPerformance.points)
  const range = Math.max(maxValue - minValue, 1)
  const points = ownerWeeklyPerformance.points
    .map((value, index, values) => {
      const x = (index / (values.length - 1)) * 148 + 2
      const y = 49 - ((value - minValue) / range) * 39
      return `${x},${y}`
    })
    .join(' ')

  return (
    <Paper
      component="section"
      aria-labelledby="weekly-performance-title"
      elevation={0}
      sx={{ ...ownerDashboardPanelSx, minHeight: 108, p: { xs: 2, md: 2.2 } }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography
            id="weekly-performance-title"
            component="h2"
            sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 500 }}
          >
            Desempenho Semanal
          </Typography>
          <Typography
            sx={{
              mt: 0.35,
              color: brand.graphite[500],
              fontSize: { xs: 21, md: 23 },
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {ownerWeeklyPerformance.value}
          </Typography>
          <Typography sx={{ mt: 0.6, color: brand.semantic.success, fontSize: 11 }}>
            {ownerWeeklyPerformance.caption}
          </Typography>
        </Box>

        <Box
          component="svg"
          role="img"
          aria-label="Tendência semanal de visualizações"
          viewBox="0 0 152 58"
          sx={{ width: { xs: 116, sm: 152 }, height: 58, flexShrink: 0, overflow: 'visible' }}
        >
          <polyline
            points={points}
            fill="none"
            stroke={brand.magenta[500]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Box>
      </Stack>
    </Paper>
  )
}
