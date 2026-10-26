import type { SxProps, Theme } from '@mui/material'

export function getLegendDotStyles(color: string): SxProps<Theme> {
  return { width: 7, height: 7, borderRadius: '50%', bgcolor: color }
}
