import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius } from '@shared/theme/tokens'

export const styles = {
  item: {
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    p: 1.4,
  },
  label: { color: brand.neutral[500], fontSize: 11, fontWeight: 900 },
  value: { color: brand.graphite[500], fontSize: 13, fontWeight: 800, mt: 0.6 },
} satisfies Record<string, SxProps<Theme>>
