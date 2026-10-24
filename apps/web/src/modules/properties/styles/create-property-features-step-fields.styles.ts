import type { SxProps, Theme } from '@mui/material'
import { radius } from '@shared/theme/tokens'

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, minmax(0, 1fr))',
      md: 'repeat(4, minmax(0, 1fr))',
    },
    gap: { xs: 1.2, md: 2 },
  },
  formControlLabel: {
    minHeight: 44,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    mx: 0,
    px: 1,
    '& .MuiFormControlLabel-label': { fontSize: 14, fontWeight: 800 },
  },
} satisfies Record<string, SxProps<Theme>>
