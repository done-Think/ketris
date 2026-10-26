import type { SxProps, Theme } from '@mui/material'
import { alpha, brand } from '@shared/theme/tokens'

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', lg: '1fr auto 1fr' },
    gap: { xs: 3.2, lg: 6.5, xl: 9 },
    alignItems: 'start',
  } satisfies SxProps<Theme>,
  box2: { minWidth: 0 } satisfies SxProps<Theme>,
  divider: {
    display: { xs: 'none', lg: 'block' },
    borderColor: alpha.graphite[10],
    minHeight: 120,
    mt: 2.2,
  } satisfies SxProps<Theme>,
  box3: { minWidth: 0 } satisfies SxProps<Theme>,
  box4: { mt: 3.2 } satisfies SxProps<Theme>,
  button: {
    mt: 3.2,
    px: 0,
    color: brand.magenta[500],
    fontSize: 13,
    fontWeight: 900,
    textTransform: 'none',
    '&:hover': { bgcolor: 'transparent', color: brand.magenta[700] },
  } satisfies SxProps<Theme>,
}
