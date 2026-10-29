import type { SxProps, Theme } from '@mui/material'
import { iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  searchRoundedIcon: { color: 'text.primary', fontSize: iconSize.lg },
  closeRoundedIcon: { fontSize: iconSize.sm },
  textField: {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      minHeight: 48,
      borderRadius: `${radius.sm}px`,
      bgcolor: surface.paper,
      fontWeight: 700,
    },
  },
} satisfies Record<string, SxProps<Theme>>
