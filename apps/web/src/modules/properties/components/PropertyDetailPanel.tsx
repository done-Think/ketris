import { Box, Typography } from '@mui/material'

import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import type { PropertyDetailPanelProps } from '../types/dashboard-property'

export function PropertyDetailPanel({ title, children }: PropertyDetailPanelProps) {
  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.md}px`,
        boxShadow: shadows.propertyCard,
        px: { xs: 2.2, md: 3.2 },
        py: { xs: 2.4, md: 3.2 },
      }}
    >
      <Typography sx={{ fontSize: 24, fontWeight: 900, mb: 2.6 }}>{title}</Typography>
      {children}
    </Box>
  )
}
