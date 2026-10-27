import type { SxProps, Theme } from '@mui/material'
import { iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  stack: { mb: 2.4 },
  box: { minWidth: 0 },
  typography: {
    color: surface.darkText,
    fontSize: { xs: 24, md: 32 },
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: 0,
    mb: 0.7,
  },
  typography2: { color: 'text.secondary', fontSize: 14, fontWeight: 500 },
  searchRoundedIcon: { color: 'text.primary', fontSize: iconSize.lg },
  textField: {
    width: { xs: '100%', md: 390 },
    '& .MuiOutlinedInput-root': {
      minHeight: 44,
      borderRadius: `${radius.sm}px`,
      bgcolor: surface.paper,
      fontSize: 13,
      fontWeight: 500,
    },
  },
} satisfies Record<string, SxProps<Theme>>
