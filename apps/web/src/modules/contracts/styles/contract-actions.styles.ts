import type { SxProps, Theme } from '@mui/material'
import { brand, radius, shadows } from '@shared/theme/tokens'

export const styles = {
  stack: { mt: { xs: 3, md: 5.2 } } satisfies SxProps<Theme>,
  button: {
    borderColor: brand.neutral[200],
    color: brand.graphite[500],
    borderRadius: `${radius.sm}px`,
    px: 2.4,
    py: 1,
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'none',
  } satisfies SxProps<Theme>,
  button2: {
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.none,
    px: { xs: 2.4, md: 3 },
    py: 1.1,
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'none',
  } satisfies SxProps<Theme>,
}
