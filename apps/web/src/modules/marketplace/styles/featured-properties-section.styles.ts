import type { SxProps, Theme } from '@mui/material'
import { iconSize, radius, surface, zIndex } from '@shared/theme/tokens'

export const styles = {
  box: {
    position: 'relative',
    zIndex: zIndex.content,
    bgcolor: surface.app,
    pt: { xs: 1.25, md: 3 },
    pb: { xs: 5, md: 7 },
  },
  northEastOutlinedIcon: { fontSize: iconSize.xs },
  box2: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
    gap: { xs: 2, md: 3 },
  },
  skeleton: { borderRadius: `${radius.sm}px` },
} satisfies Record<string, SxProps<Theme>>
