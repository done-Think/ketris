import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  stack: {
    minHeight: 320,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    textAlign: 'center',
    px: 2,
  } satisfies SxProps<Theme>,
  box: {
    width: 54,
    height: 54,
    borderRadius: radius.full,
    bgcolor: alpha.magenta[8],
    color: brand.magenta[500],
    display: 'grid',
    placeItems: 'center',
  } satisfies SxProps<Theme>,
  descriptionOutlinedIcon: { fontSize: iconSize.xl } satisfies SxProps<Theme>,
  typography: {
    color: brand.graphite[500],
    fontSize: 18,
    fontWeight: 900,
    mb: 0.6,
  } satisfies SxProps<Theme>,
  typography2: { color: brand.neutral[500], fontSize: 14 } satisfies SxProps<Theme>,
  button: {
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.none,
    mt: 0.6,
    textTransform: 'none',
    fontWeight: 900,
  } satisfies SxProps<Theme>,
}
