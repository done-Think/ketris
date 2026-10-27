import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const stackSx: SxProps<Theme> = { display: { xs: 'none', md: 'flex' } }

export function getMenuItemSx(active: boolean): SxProps<Theme> {
  return {
    minHeight: 42,
    bgcolor: active ? alpha.magenta[8] : 'transparent',
    '&:hover': {
      bgcolor: alpha.magenta[8],
    },
  }
}

export const extraStyleSx1: SxProps<Theme> = {
  mt: 0.6,
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.popover,
}

export function extraStyleSx2(isDesktop: boolean, isColumn: boolean): SxProps<Theme> {
  return {
    display: isDesktop ? { xs: 'flex', md: 'none' } : 'flex',
    width: isColumn ? '100%' : { xs: '100%', sm: 160 },
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
  }
}
