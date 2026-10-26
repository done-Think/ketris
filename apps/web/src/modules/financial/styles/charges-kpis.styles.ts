import type { SxProps, Theme } from '@mui/material'

export const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(3, minmax(0, 1fr))' },
    gap: { xs: 1.4, md: 1.8 },
  },
} satisfies Record<string, SxProps<Theme>>
