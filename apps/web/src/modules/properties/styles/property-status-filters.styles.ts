import { alpha, brand, radius, shadows, surface, motion } from '@shared/theme/tokens'
import type { SxProps, Theme } from '@mui/material'

export const styles = {
  menuPaper: { mt: 0.6, borderRadius: `${radius.sm}px`, boxShadow: shadows.popover },
  textField: {
    display: { xs: 'block', sm: 'none' },
    width: '100%',
    mb: 1.8,
    '& .MuiOutlinedInput-root': {
      minHeight: 46,
      borderRadius: `${radius.sm}px`,
      bgcolor: surface.paper,
      color: brand.graphite[500],
      fontSize: 14,
      fontWeight: 800,
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: 'transparent',
        borderWidth: 0,
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
      borderWidth: 0,
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
    },
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      gap: 0.8,
    },
  },
  stack: { display: { xs: 'none', sm: 'flex' }, mb: 1.8 },
  dashboardStatusFilterButton: { transition: motion.transition.bordered },
  box: { display: 'flex', alignItems: 'center', gap: 0.8 },
} satisfies Record<string, SxProps<Theme>>

export function getMenuItemStyles(active: boolean): SxProps<Theme> {
  return {
    minHeight: 42,
    bgcolor: active ? alpha.magenta[8] : 'transparent',
    '&:hover': {
      bgcolor: alpha.magenta[8],
    },
  }
}

export function getCountStyles(active: boolean): SxProps<Theme> {
  return {
    display: 'grid',
    minWidth: 26,
    height: 26,
    placeItems: 'center',
    px: 0.6,
    borderRadius: `${radius.full}px`,
    bgcolor: active ? brand.magenta[500] : alpha.graphite[6],
    color: active ? surface.lightText : brand.neutral[500],
    fontSize: 15,
    fontWeight: 900,
  }
}
