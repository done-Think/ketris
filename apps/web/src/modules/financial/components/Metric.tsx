import { Box, Stack, Typography } from '@mui/material'

import { brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { MetricProps } from '../types/charge'
import { chargeStatusColors as statusColors } from './charge-status-colors'

export function Metric({ label, value, icon, tone }: MetricProps) {
  const colors = {
    success: statusColors.paid.bg,
    error: statusColors.overdue.bg,
    warning: statusColors.pending.bg,
  }
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        minHeight: 76,
        p: 2,
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.crmCardCompact,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: colors[tone],
          color:
            tone === 'error' ? 'error.main' : tone === 'success' ? 'success.main' : 'warning.dark',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        <Typography sx={{ fontSize: 11.5, color: brand.neutral[500] }}>{label}</Typography>
        <Typography sx={{ fontSize: { xs: 19, md: 20 }, fontWeight: 900 }}>{value}</Typography>
      </Box>
    </Stack>
  )
}
