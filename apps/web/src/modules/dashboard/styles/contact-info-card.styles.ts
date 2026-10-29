import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius } from '@shared/theme/tokens'

export const styles = {
  box: {
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    p: 1.4,
  },
  personOutlineOutlinedIcon: { color: brand.magenta[500], fontSize: 18 },
  typography: { color: brand.neutral[500], fontSize: 11, fontWeight: 900 },
  typography2: { color: brand.graphite[500], fontSize: 14, fontWeight: 900, mt: 0.7 },
  muiLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.6,
    color: brand.magenta[600],
    fontSize: 12,
    fontWeight: 900,
    mt: 0.4,
  },
  phoneOutlinedIcon: { fontSize: 15 },
} satisfies Record<string, SxProps<Theme>>
