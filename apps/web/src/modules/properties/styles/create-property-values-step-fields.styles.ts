import type { SxProps, Theme } from '@mui/material'

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
    gap: 2,
  },
} satisfies Record<string, SxProps<Theme>>
