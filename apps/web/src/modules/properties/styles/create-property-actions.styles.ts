import { radius, alpha, iconSize, surface, zIndex } from '@shared/theme/tokens'
import type { SxProps, Theme } from '@mui/material'

export const styles = {
  stack: {
    position: { xs: 'fixed', md: 'static' },
    right: { xs: 0, md: 'auto' },
    bottom: { xs: 0, md: 'auto' },
    left: { xs: 0, md: 'auto' },
    zIndex: { xs: zIndex.header, md: 'auto' },
    bgcolor: { xs: surface.paper, md: 'transparent' },
    borderTop: { xs: '1px solid', md: 0 },
    borderColor: { xs: alpha.graphite[8], md: 'transparent' },
    p: { xs: 1.6, md: 0 },
  },
  chevronLeftRoundedIcon: { fontSize: iconSize.sm },
  chevronRightRoundedIcon: { fontSize: iconSize.sm },
  button: {
    flex: { xs: 1, md: 'initial' },
    minHeight: { xs: 44, md: 40 },
    px: 2.4,
    borderRadius: `${radius.sm}px`,
    fontWeight: 900,
  },
} satisfies Record<string, SxProps<Theme>>

export function getPreviousButtonStyles(firstStep: boolean): SxProps<Theme> {
  return {
    display: { xs: firstStep ? 'none' : 'inline-flex', md: 'inline-flex' },
    minHeight: 40,
    px: 2.4,
    borderRadius: `${radius.sm}px`,
    fontWeight: 900,
  }
}
