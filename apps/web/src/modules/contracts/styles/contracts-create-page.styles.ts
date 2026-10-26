import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    width: '100%',
    p: 3.5,
  } satisfies SxProps<Theme>,
  box2: { width: '100%', maxWidth: 1540, mx: 'auto' } satisfies SxProps<Theme>,
  stack: { mb: { xs: 3, md: 4.5 } } satisfies SxProps<Theme>,
  muiLink: { color: brand.neutral[500], fontSize: 12, fontWeight: 700 } satisfies SxProps<Theme>,
  typography: { color: brand.neutral[400], fontSize: 12 } satisfies SxProps<Theme>,
  typography2: {
    color: brand.magenta[500],
    fontSize: 12,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  typography3: { fontSize: { xs: 20, md: 24 }, fontWeight: 800 } satisfies SxProps<Theme>,
  box3: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
    px: { xs: 2, md: 3.6, xl: 4.4 },
    py: { xs: 2.6, md: 3.4, xl: 4 },
  } satisfies SxProps<Theme>,
  typography4: {
    color: brand.graphite[500],
    fontSize: 20,
    fontWeight: 900,
    mb: 2.4,
  } satisfies SxProps<Theme>,
  dialogTitle: { letterSpacing: 0 } satisfies SxProps<Theme>,
}
