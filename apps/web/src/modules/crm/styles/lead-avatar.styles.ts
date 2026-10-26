import type { SxProps, Theme } from '@mui/material'
import { alpha, brand } from '@shared/theme/tokens'

export const avatarSx: SxProps<Theme> = {
  width: 35,
  height: 35,
  bgcolor: alpha.magenta[10],
  color: brand.magenta[700],
  fontSize: 13.5,
  fontWeight: 900,
}
