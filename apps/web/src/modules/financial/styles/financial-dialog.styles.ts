import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize, radius } from '@shared/theme/tokens'

export const styles = {
  paper: {
    borderRadius: `${radius.sm}px`,
    maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
  },
  title: { px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 },
  titleText: { color: brand.graphite[500], fontSize: 22, fontWeight: 900 },
  closeIcon: { fontSize: iconSize.lg },
  content: { px: { xs: 2, md: 2.8 }, pb: 2, pt: '12px !important' },
  actions: { px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 },
  grid: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
    gap: 1.5,
  },
  fullRow: { gridColumn: { xs: '1', sm: '1 / -1' } },
  hint: { color: 'text.secondary', fontSize: 13 },
} satisfies Record<string, SxProps<Theme>>
