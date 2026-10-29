import type { SxProps, Theme } from '@mui/material'
import { brand } from '@shared/theme/tokens'

export const stackSx: SxProps<Theme> = { mt: 1.6 }

export const typographySx: SxProps<Theme> = { fontSize: 11, color: brand.neutral[500] }

export const typographySx2: SxProps<Theme> = {
  fontSize: 11,
  color: brand.graphite[500],
  fontWeight: 800,
  textAlign: 'right',
}
