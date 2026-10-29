import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, minmax(0, 1fr))',
      md: 'repeat(3, minmax(0, 1fr))',
      lg: 'repeat(6, minmax(0, 1fr))',
    },
    gap: { xs: 1.2, md: 1.6 },
  },
  box2: {
    minWidth: 0,
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
    p: { xs: 1.45, md: 2.2 },
  },
  typography: {
    color: brand.neutral[500],
    fontSize: { xs: 10.5, md: 11 },
    fontWeight: 900,
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  },
  box3: { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 0.9, mt: 0.7 },
  typography2: {
    color: brand.graphite[500],
    fontSize: { xs: 22, sm: 28 },
    fontWeight: 900,
    lineHeight: 1.12,
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, SxProps<Theme>>
