import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  dialogTitle: { px: { xs: 2, md: 2.8 }, pb: 1.2, pt: 2.4 },
  stack: { alignItems: 'flex-start', justifyContent: 'space-between' },
  stack2: { minWidth: 0 },
  typography: { color: brand.magenta[600], fontSize: 12, fontWeight: 900 },
  typography2: { color: brand.graphite[500], fontSize: 20, fontWeight: 900 },
  closeOutlinedIcon: { fontSize: iconSize.lg },
  chip: {
    alignSelf: 'flex-start',
    bgcolor: alpha.magenta[8],
    color: brand.magenta[700],
    fontSize: 12,
    fontWeight: 900,
  },
  dialogContent: { bgcolor: surface.paper, px: { xs: 2, md: 2.8 }, pb: 2.2 },
  box: {
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    p: 2,
  },
  box2: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
    gap: 1.4,
  },
  typography3: { color: brand.neutral[500], fontSize: 11, fontWeight: 900 },
  typography4: { color: brand.graphite[500], fontSize: 13, fontWeight: 800 },
  dialogActions: { px: { xs: 2, md: 2.8 }, pb: 2.6, pt: 0 },
} satisfies Record<string, SxProps<Theme>>
