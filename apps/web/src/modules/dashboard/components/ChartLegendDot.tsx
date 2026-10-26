import { Box, Stack } from '@mui/material'

import { getLegendDotStyles } from '../styles/chart-legend-dot.styles'
import type { ChartLegendDotProps } from '../types/agency-overview'

export function ChartLegendDot({ color, label }: ChartLegendDotProps) {
  return (
    <Stack component="span" direction="row" alignItems="center" spacing={0.6}>
      <Box sx={getLegendDotStyles(color)} />
      <Box component="span">{label}</Box>
    </Stack>
  )
}
