import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  contractDetailPanel: { flex: 1 } satisfies SxProps<Theme>,
  stack: { flex: 1, justifyContent: 'space-between' } satisfies SxProps<Theme>,
  stack2: {
    minHeight: { xs: 58, md: 72 },
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.app,
    px: 1.6,
  } satisfies SxProps<Theme>,
  articleOutlinedIcon: {
    color: brand.magenta[500],
    fontSize: iconSize.xl,
  } satisfies SxProps<Theme>,
  box: { flex: 1, minWidth: 0 } satisfies SxProps<Theme>,
  typography: {
    color: brand.graphite[500],
    fontSize: 14,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  typography2: {
    color: brand.neutral[500],
    fontSize: 11,
    fontWeight: 700,
  } satisfies SxProps<Theme>,
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    color: brand.graphite[500],
  } satisfies SxProps<Theme>,
  downloadOutlinedIcon: { fontSize: iconSize.md } satisfies SxProps<Theme>,
}
