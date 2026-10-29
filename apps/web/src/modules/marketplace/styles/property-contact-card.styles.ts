import type { SxProps, Theme } from '@mui/material'
import { alpha, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    position: { lg: 'sticky' },
    top: { lg: 84 },
    bgcolor: surface.paper,
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
    p: 2,
  },
  typography: { fontSize: 28, fontWeight: 900, lineHeight: 1.15 },
  typography2: { color: 'text.secondary', fontSize: 12, fontWeight: 700, mb: 2 },
  stack: { mb: 2 },
  stack2: { mb: 1.5 },
  avatar: { width: 48, height: 48 },
  typography3: { fontWeight: 900 },
  typography4: { color: 'text.secondary', fontSize: 12, fontWeight: 700 },
  icon: { fontSize: iconSize.xs },
  button: {
    flex: 1,
    minWidth: 0,
    borderColor: 'divider',
    bgcolor: alpha.graphite[6],
    fontSize: 11,
  },
} satisfies Record<string, SxProps<Theme>>
