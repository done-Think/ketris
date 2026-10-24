import type { SxProps, Theme } from '@mui/material'
import { brand } from '@shared/theme/tokens'

export const styles = {
  typography: {
    color: { xs: brand.neutral[500], md: 'primary.main' },
    fontSize: { xs: 11, md: 13 },
    fontWeight: 900,
    mb: { xs: 1.8, md: 2.2 },
    textTransform: 'uppercase',
  },
} satisfies Record<string, SxProps<Theme>>
