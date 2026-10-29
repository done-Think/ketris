import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius } from '@shared/theme/tokens'

export const styles = {
  container: {
    border: '1px dashed',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    p: 1.5,
  },
  name: { color: brand.graphite[500], fontSize: 13, fontWeight: 800, overflowWrap: 'anywhere' },
  hint: { color: brand.neutral[500], fontSize: 11.5 },
  error: { color: 'error.main', fontSize: 12 },
  hiddenInput: { display: 'none' },
} satisfies Record<string, SxProps<Theme>>
