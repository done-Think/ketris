import type { SxProps, Theme } from '@mui/material'
import { brand, radius } from '@shared/theme/tokens'

export const styles = {
  stack: { mb: 1.7 } satisfies SxProps<Theme>,
  box: {
    width: 5,
    height: 20,
    borderRadius: radius.full,
    bgcolor: brand.magenta[500],
    flexShrink: 0,
  } satisfies SxProps<Theme>,
  typography: {
    color: brand.graphite[500],
    fontSize: 16,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  box2: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
    gap: { xs: 1.8, md: 2.2, xl: 2.6 },
  } satisfies SxProps<Theme>,
}
