import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  dialogTitle: { px: { xs: 2, md: 2.8 }, pb: 1.2, pt: 2.4 },
  stack: { alignItems: 'center', minWidth: 0 },
  avatar: { width: 44, height: 44, fontSize: 14 },
  box: { minWidth: 0 },
  typography: { color: brand.magenta[600], fontSize: 12, fontWeight: 900 },
  typography2: { color: brand.graphite[500], fontSize: 20, fontWeight: 900 },
  typography3: { color: brand.neutral[500], fontSize: 12, fontWeight: 700 },
  closeOutlinedIcon: { fontSize: iconSize.lg },
  dialogContent: { px: { xs: 2, md: 2.8 }, pb: 2.2 },
  box2: {
    bgcolor: surface.app,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    p: 1.6,
  },
  typography4: { mb: 1.2, color: brand.graphite[500], fontSize: 15, fontWeight: 900 },
  box3: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
    gap: 1,
    p: 1.4,
    textDecoration: 'none',
    transition: 'border-color 160ms ease, background-color 160ms ease',
    '&:hover': {
      bgcolor: alpha.magenta[6],
      borderColor: alpha.magenta[14],
    },
  },
  typography5: { color: brand.graphite[500], fontSize: 13, fontWeight: 900 },
  typography6: { color: brand.neutral[500], fontSize: 11.5, fontWeight: 700 },
  typography7: {
    color: brand.magenta[600],
    fontSize: 13,
    fontWeight: 900,
    justifySelf: { xs: 'start', sm: 'end' },
  },
  dialogActions: { px: { xs: 2, md: 2.8 }, pb: 2.6, pt: 0 },
  openInNewOutlinedIcon: { fontSize: iconSize.sm },
} satisfies Record<string, SxProps<Theme>>
