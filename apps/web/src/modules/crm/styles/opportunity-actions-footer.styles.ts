import type { SxProps, Theme } from '@mui/material'
import { radius, shadows } from '@shared/theme/tokens'

export const paperSx: SxProps<Theme> = {
  p: { xs: 1.4, sm: 1.7 },
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: `${radius.md}px`,
  boxShadow: shadows.popover,
}
