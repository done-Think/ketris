import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  card: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
    minWidth: 0,
    p: { xs: 2, md: 2.4 },
  },
  title: { color: brand.graphite[500], fontSize: 18, fontWeight: 900, mb: 2 },
  chart: { height: { xs: 260, md: 320 }, width: '100%' },
  barChart: {
    '& .MuiChartsAxis-left': { display: 'none' },
    '& .MuiChartsLegend-root': { display: 'none' },
    '& .MuiBarElement-root': {
      rx: 5,
      ry: 5,
    },
  },
} satisfies Record<string, SxProps<Theme>>
