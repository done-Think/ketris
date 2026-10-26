import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, motion, radius, surface, shadows } from '@shared/theme/tokens'

export const styles = {
  stack: {
    display: 'flex',
    alignItems: 'center',
    mb: 1.8,
  } satisfies SxProps<Theme>,
  dashboardStatusFilterButton: {
    display: { xs: 'none', sm: 'inline-flex' },
    transition: motion.transition.bordered,
  } satisfies SxProps<Theme>,
  textField: {
    width: { xs: '100%', sm: 180 },
    ml: { sm: 'auto' },
    '& .MuiInputBase-root': {
      height: { xs: 40, sm: 32 },
      borderRadius: `${radius.sm}px`,
      bgcolor: surface.paper,
      color: brand.graphite[500],
      fontSize: 12,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha.graphite[8],
    },
  } satisfies SxProps<Theme>,
}

export const dashboardFilterSelectSx = {
  width: { xs: '100%', sm: 160 },
  display: { xs: 'block', sm: 'none' },
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
  },
  '& .MuiMenu-paper': {
    mt: 0.6,
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.popover,
  },
}
