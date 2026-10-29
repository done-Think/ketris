import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(1, minmax(0, 1fr))',
      sm: 'repeat(2, minmax(0, 1fr))',
      lg: 'repeat(4, minmax(0, 1fr))',
    },
    gap: { xs: 0.8, sm: 1.4, xl: 1.8 },
  },
  card: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.crmCard,
    minHeight: { xs: 116, sm: 132 },
    minWidth: 0,
    overflow: 'hidden',
    p: { xs: 1.4, sm: 2 },
  },
  content: { minWidth: 0 },
  label: { color: brand.neutral[500], fontSize: { xs: 11, sm: 13 }, fontWeight: 800 },
  value: { color: brand.graphite[500], fontSize: { xs: 23, sm: 28 }, fontWeight: 900 },
} satisfies Record<string, SxProps<Theme>>
