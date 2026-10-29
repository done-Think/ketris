import type { SxProps, Theme } from '@mui/material'
import { dashboardHeaderFilterButtonSx } from '@shared/components/layout'
import { alpha, brand, radius, surface } from '@shared/theme/tokens'
import type { CrmStatusColors } from '../types/style'

export const stackSx: SxProps<Theme> = {
  width: { xs: '100%', lg: 'auto' },
  minWidth: 0,
  alignItems: { sm: 'center' },
}

export const toggleButtonGroupSx: SxProps<Theme> = {
  flexShrink: 0,
  height: 36,
  '& .MuiToggleButton-root': {
    px: 1.1,
    borderColor: brand.neutral[100],
    color: 'text.secondary',
    '&.Mui-selected': {
      bgcolor: brand.neutral[50],
      color: 'text.primary',
    },
  },
}

export const viewKanbanOutlinedIconSx: SxProps<Theme> = { fontSize: 16 }

export const searchRoundedIconSx: SxProps<Theme> = { color: 'text.disabled', fontSize: 16 }

export const textFieldSx: SxProps<Theme> = {
  width: { xs: '100%', sm: 224 },
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
  '& .MuiInputBase-input::placeholder': {
    color: brand.neutral[400],
    opacity: 1,
  },
}

export const buttonSx: SxProps<Theme> = {
  ...dashboardHeaderFilterButtonSx,
  width: { xs: '100%', sm: 'auto' },
  minWidth: { sm: 148 },
  flexShrink: 0,
}

export const boxSx: SxProps<Theme> = { display: { xs: 'none', md: 'block' } }

export function getBoxSx(stage: CrmStatusColors): SxProps<Theme> {
  return {
    width: 8,
    height: 8,
    mr: 1.2,
    borderRadius: `${radius.full}px`,
    bgcolor: stage.color,
  }
}
