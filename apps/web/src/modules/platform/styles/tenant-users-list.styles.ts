import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  card: {
    bgcolor: surface.paper,
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
  },
  stack: {
    px: { xs: 2, md: 2.4 },
    py: 1.8,
    borderBottom: '1px solid',
    borderColor: alpha.graphite[6],
  },
  typography: { color: brand.graphite[500], fontSize: 16, fontWeight: 900 },
  chip: { fontWeight: 800, height: 22 },
  stack2: { py: 6 },
  typography2: { color: brand.neutral[500], fontSize: 13.5, py: 6, textAlign: 'center' },
  box: { listStyle: 'none', m: 0, p: 0 },
  box2: {
    px: 2,
    py: 1.5,
    borderBottom: '1px solid',
    borderColor: alpha.graphite[6],
    '&:last-of-type': { borderBottom: 0 },
  },
  typography3: { color: brand.graphite[500], fontSize: 14, fontWeight: 800 },
  typography4: { color: brand.neutral[500], fontSize: 13, overflowWrap: 'anywhere' },
  stack3: { mt: 0.8 },
  tableCell: { fontWeight: 700 },
  stack4: { px: 3, py: { xs: 5, md: 6 }, textAlign: 'center' },
  box3: {
    display: 'grid',
    placeItems: 'center',
    width: 48,
    height: 48,
    mb: 0.5,
    borderRadius: radius.full,
    bgcolor: alpha.magenta[8],
    color: brand.magenta[500],
  },
  typography5: { color: brand.graphite[500], fontSize: 15, fontWeight: 900 },
  typography6: { color: brand.neutral[500], fontSize: 13, maxWidth: 360 },
} satisfies Record<string, SxProps<Theme>>
