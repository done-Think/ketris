import type { SxProps, Theme } from '@mui/material'
import { shadows } from '@shared/theme/tokens'
import { surface } from '@shared/theme/tokens'
import { radius } from '@shared/theme/tokens'
import { zIndex } from '@shared/theme/tokens'

export function getBoxStyles({ isPriceRange }: { isPriceRange: boolean }): SxProps<Theme> {
  return {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: isPriceRange ? 'auto' : 0,
    right: isPriceRange ? 0 : 'auto',
    width: '100%',
    maxWidth: 'calc(100vw - 32px)',
    zIndex: zIndex.dropdown,
    display: { xs: 'none', md: 'block' },
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    color: 'text.primary',
    boxShadow: shadows.popover,
    overflow: isPriceRange ? 'visible' : 'hidden',
  }
}
