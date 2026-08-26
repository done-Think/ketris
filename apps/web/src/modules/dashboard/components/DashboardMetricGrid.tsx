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
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
        gap: 1.6,
      }}
    >
      {dashboardMetrics.map((metric) => (
        <DashboardPanel key={metric.label}>
          <Box sx={{ p: { xs: 2, md: 2.2 } }}>
            <Typography
              sx={{
                color: brand.neutral[500],
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
              }}
            >
              {metric.label}
            </Typography>
            <Typography sx={{ mt: 0.7, color: brand.graphite[500], fontSize: 28, fontWeight: 900 }}>
              {metric.value}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mt: 0.4 }}>
              {metric.tone === 'success' ? (
                <NorthIcon sx={{ color: brand.semantic.success, fontSize: 13 }} />
              ) : null}
              <Typography
                sx={{
                  color: metric.tone === 'danger' ? brand.magenta[600] : brand.semantic.success,
                  fontSize: 11,
                  fontWeight: 900,
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
