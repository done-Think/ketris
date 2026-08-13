'use client'

import { Box, Typography } from '@mui/material'

import { iconSize, radius, surface } from '@shared/theme/tokens'

import type { PublicProfileMetricsProps } from '../../types/profile'

export function PublicProfileMetrics({ accentColor, metrics }: PublicProfileMetricsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, 1fr)' },
        gap: 1,
        mb: 2.5,
      }}
    >
      {metrics.map(({ label, value, icon: MetricIcon }) => (
        <Box
          key={label}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            px: 1.5,
            py: 1.3,
          }}
        >
          {MetricIcon ? (
            <MetricIcon sx={{ color: accentColor, fontSize: iconSize.md, mb: 0.4 }} />
          ) : null}
          <Typography sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography sx={{ color: accentColor, fontSize: 20, fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
