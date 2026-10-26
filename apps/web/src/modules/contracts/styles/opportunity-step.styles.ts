import type { SxProps, Theme } from '@mui/material'
import { alpha, radius } from '@shared/theme/tokens'

export const styles = {
  box: {
    mt: 2.4,
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
    gap: 1.8,
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    p: { xs: 2, md: 2.4 },
  } satisfies SxProps<Theme>,
}
