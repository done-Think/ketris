import type { SxProps, Theme } from '@mui/material'

export const styles = {
  page: { width: '100%', p: 3.5 },
  desktopOnly: { display: { xs: 'none', md: 'block' } },
  twoColumns: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(280px, 1fr)' },
    gap: 1.6,
    alignItems: 'stretch',
  },
} satisfies Record<string, SxProps<Theme>>
