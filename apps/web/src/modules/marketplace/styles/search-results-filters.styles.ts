import type { SxProps, Theme } from '@mui/material'

import { alpha, iconSize, motion, radius, surface } from '@shared/theme/tokens'

export function getFilterButtonStyles(active: boolean): SxProps<Theme> {
  return {
    minHeight: 34,
    borderRadius: `${radius.sm}px`,
    bgcolor: active ? 'primary.main' : surface.paper,
    color: active ? surface.lightText : 'text.primary',
    borderColor: active ? 'primary.main' : 'divider',
    px: 1.5,
    fontWeight: 700,
    textTransform: 'none',
    transition: motion.transition.bordered,
    '& .MuiButton-startIcon svg': { fontSize: iconSize.xs },
    '&:hover': {
      bgcolor: active ? 'primary.dark' : alpha.magenta[6],
      borderColor: active ? 'primary.dark' : 'primary.main',
    },
  }
}
