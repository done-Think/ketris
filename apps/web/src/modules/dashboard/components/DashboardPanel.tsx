import { Box } from '@mui/material'

import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import type { DashboardPanelProps } from '../types/dashboard-overview'

export function DashboardPanel({ children }: DashboardPanelProps) {
  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
      }}
    >
      {children}
    </Box>
  )
}
