import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize } from '@shared/theme/tokens'

export const boxSx: SxProps<Theme> = { display: 'inline-flex' }

export const iconButtonSx: SxProps<Theme> = {
  width: 24,
  height: 24,
  color: brand.neutral[400],
  '&:hover': { bgcolor: alpha.graphite[6], color: brand.neutral[600] },
  '&.Mui-disabled': { color: brand.neutral[400] },
}

export const iconSx: SxProps<Theme> = { fontSize: iconSize.sm }

export const iconButtonSx2: SxProps<Theme> = {
  width: 24,
  height: 24,
  color: brand.neutral[400],
  '&:hover': { bgcolor: alpha.graphite[6], color: brand.neutral[600] },
  '&.Mui-disabled': { color: brand.neutral[400] },
}
