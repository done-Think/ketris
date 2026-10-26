import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius } from '@shared/theme/tokens'

export const styles = {
  typography: { color: brand.neutral[500], fontSize: 12, fontWeight: 700 } satisfies SxProps<Theme>,
  typography2: {
    color: brand.graphite[500],
    fontSize: 14,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  box: {
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    p: { xs: 2, md: 2.4 },
  } satisfies SxProps<Theme>,
  box2: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
    gap: 1.8,
  } satisfies SxProps<Theme>,
  box3: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
    gap: { xs: 2, md: 2.4 },
  } satisfies SxProps<Theme>,
}
