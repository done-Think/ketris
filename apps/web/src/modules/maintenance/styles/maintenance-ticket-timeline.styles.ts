import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, surface } from '@shared/theme/tokens'

export const stackSx: SxProps<Theme> = { mt: 1.7 }

export const avatarSx: SxProps<Theme> = {
  width: 34,
  height: 34,
  bgcolor: brand.graphite[400],
  fontSize: 11,
  fontWeight: 900,
}

export const typographySx: SxProps<Theme> = {
  fontSize: 12,
  color: brand.graphite[500],
  fontWeight: 900,
}

export const typographySx2: SxProps<Theme> = { fontSize: 10.5, color: brand.neutral[400] }

export const typographySx3: SxProps<Theme> = {
  mt: 0.45,
  color: brand.neutral[600],
  fontSize: 12,
  lineHeight: 1.5,
}

export const typographySx4: SxProps<Theme> = { mt: 1.7, color: brand.neutral[400], fontSize: 12 }

export const dividerSx: SxProps<Theme> = { my: 1.7 }

export const rhfTextFieldSx: SxProps<Theme> = {
  '& .MuiInputBase-root': { bgcolor: surface.app, fontSize: 12, lineHeight: 1.5 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha.graphite[8] },
}

export const stackSx2: SxProps<Theme> = { mt: 1 }
