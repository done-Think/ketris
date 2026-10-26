import type { SxProps, Theme } from '@mui/material'
import { alpha, brand } from '@shared/theme/tokens'

export const styles = {
  box: { minWidth: 0, p: { xs: 2, md: 2.4 } },
  stack: { mb: 1 },
  typography: { color: brand.graphite[500], fontSize: 15, fontWeight: 900 },
  typography2: { color: brand.neutral[500], fontSize: 11.5, fontWeight: 700 },
  stack2: { color: brand.neutral[500], fontSize: 11 },
  box2: { minHeight: { xs: 230, md: 270 }, overflow: 'hidden' },
  lineChart: {
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
  },
} satisfies Record<string, SxProps<Theme>>
