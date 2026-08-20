import { Box, Stack, Typography } from '@mui/material'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import {
  dashboardActivities,
  dashboardMetrics,
  dashboardPipeline,
} from '../data/dashboard-overview'

export function DashboardOverviewPage() {
  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <Box>
          <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 900 }}>
            Dashboard
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15, md: 17 } }}>
            Visão geral da operação comercial.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
            gap: 1.6,
          }}
        >
          {dashboardMetrics.map((metric) => (
            <Box
              key={metric.label}
              sx={{
                bgcolor: surface.paper,
                border: '1px solid',
                borderColor: alpha.graphite[6],
                borderRadius: `${radius.sm}px`,
                boxShadow: shadows.propertyCard,
                p: 2.2,
              }}
            >
              <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>
                {metric.label}
              </Typography>
              <Typography sx={{ mt: 0.6, fontSize: 32, fontWeight: 900 }}>
                {metric.value}
              </Typography>
              <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 800 }}>
                {metric.caption}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.05fr 1fr' },
            gap: 1.6,
          }}
        >
          <Box
            sx={{
              bgcolor: surface.paper,
              border: '1px solid',
              borderColor: alpha.graphite[6],
              borderRadius: `${radius.sm}px`,
              boxShadow: shadows.propertyCard,
              p: 2.4,
            }}
          >
            <Typography variant="h5">Pipeline</Typography>
            <Stack spacing={1.2} sx={{ mt: 2 }}>
              {dashboardPipeline.map((item) => (
                <Stack
                  key={item.label}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1 }}
                >
                  <Typography sx={{ fontWeight: 800 }}>{item.label}</Typography>
                  <Typography sx={{ fontWeight: 900 }}>{item.value}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Box
            sx={{
              bgcolor: surface.paper,
              border: '1px solid',
              borderColor: alpha.graphite[6],
              borderRadius: `${radius.sm}px`,
              boxShadow: shadows.propertyCard,
              p: 2.4,
            }}
          >
            <Typography variant="h5">Atividades recentes</Typography>
            <Stack spacing={1.6} sx={{ mt: 2 }}>
              {dashboardActivities.map((activity) => (
                <Box key={activity.title}>
                  <Typography sx={{ fontWeight: 900 }}>{activity.title}</Typography>
                  <Typography sx={{ color: 'text.secondary' }}>{activity.description}</Typography>
                  <Typography sx={{ color: brand.magenta[600], fontSize: 12, fontWeight: 800 }}>
                    {activity.timestamp}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}
