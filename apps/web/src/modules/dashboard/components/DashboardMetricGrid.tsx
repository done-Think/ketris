import { Box, Stack, Typography } from '@mui/material'
import NorthIcon from '@mui/icons-material/North'

import { brand } from '@shared/theme/tokens'

import { dashboardMetrics } from '../data/dashboard-overview'
import { DashboardPanel } from './DashboardPanel'

export function DashboardMetricGrid() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, 1fr)' },
        gap: { xs: 1.2, md: 1.6 },
      }}
    >
      {dashboardMetrics.map((metric) => (
        <DashboardPanel key={metric.label}>
          <Box sx={{ minHeight: { xs: 118, md: 'auto' }, p: { xs: 1.45, md: 2.2 } }}>
            <Typography
              sx={{
                color: brand.neutral[500],
                fontSize: { xs: 10.5, md: 11 },
                fontWeight: 900,
                textTransform: 'uppercase',
              }}
            >
              {metric.label}
            </Typography>
            <Typography
              sx={{
                mt: { xs: 0.9, md: 0.7 },
                color: brand.graphite[500],
                fontSize: { xs: 22, sm: 28 },
                fontWeight: 900,
                lineHeight: 1.12,
              }}
            >
              {metric.value}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.25}
              sx={{ mt: { xs: 0.7, md: 0.4 } }}
            >
              {metric.tone === 'success' ? (
                <NorthIcon sx={{ color: brand.semantic.success, fontSize: 13 }} />
              ) : null}
              <Typography
                sx={{
                  color: metric.tone === 'danger' ? brand.magenta[600] : brand.semantic.success,
                  fontSize: { xs: 10.5, md: 11 },
                  fontWeight: 900,
                  lineHeight: 1.25,
                }}
              >
                {metric.caption}
              </Typography>
            </Stack>
          </Box>
        </DashboardPanel>
      ))}
    </Box>
  )
}
