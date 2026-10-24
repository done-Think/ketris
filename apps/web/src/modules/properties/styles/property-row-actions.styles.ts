import type { SxProps, Theme } from '@mui/material'
import { alpha, iconSize } from '@shared/theme/tokens'

export const styles = {
  stack: { width: '100%', justifyContent: 'center', alignItems: 'center', height: '100%' },
  visibilityOutlinedIcon: { fontSize: iconSize.md },
  moreVertIcon: { fontSize: iconSize.md },
  editOutlinedIcon: { fontSize: iconSize.md },
  visibilityOffOutlinedIcon: { fontSize: iconSize.md },
  publishOutlinedIcon: { fontSize: iconSize.md },
  menuItem: { color: 'error.main' },
  deleteOutlineRoundedIcon: { fontSize: iconSize.md, color: 'error.main' },
} satisfies Record<string, SxProps<Theme>>

export const rowActionButtonStyles: SxProps<Theme> = {
  width: 36,
  height: 36,
  border: '1px solid',
  borderColor: 'divider',
  color: 'text.secondary',
  '&:hover': {
    borderColor: 'primary.main',
    color: 'primary.main',
    bgcolor: alpha.magenta[6],
  },
}
