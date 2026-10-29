import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius } from '@shared/theme/tokens'

export const styles = {
  typography: { color: brand.neutral[500], fontSize: 11, fontWeight: 900 },
  paper: {
    borderRadius: `${radius.sm}px`,
    overflow: 'hidden',
  },
  dialogTitle: { px: { xs: 2, md: 2.6 }, py: 2 },
  box2: { minWidth: 0 },
  typography3: { color: brand.graphite[500], fontSize: { xs: 20, md: 24 }, fontWeight: 900 },
  dialogContent: { px: { xs: 2, md: 2.6 }, pb: 2.6 },
  box3: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
    gap: 1,
  },
  box4: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
    gap: 1,
    mt: 1,
  },
  box5: {
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    p: 1.4,
    mt: 1,
  },
  typography4: { color: brand.graphite[500], fontSize: 13, fontWeight: 700, mt: 0.6 },
} satisfies Record<string, SxProps<Theme>>
