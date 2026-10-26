import type { SxProps, Theme } from '@mui/material'
import { radius } from '@shared/theme/tokens'

export function stageMarkerSx(color: string): SxProps<Theme> {
  return { width: 8, height: 8, mr: 1.2, borderRadius: `${radius.full}px`, bgcolor: color }
}
