import type { SxProps, Theme } from '@mui/material'

export const styles = {
  page: { width: '100%', p: 3.5 },
  grid: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.55fr) minmax(320px, 0.95fr)' },
    gap: 2,
    alignItems: 'stretch',
  },
} satisfies Record<string, SxProps<Theme>>
