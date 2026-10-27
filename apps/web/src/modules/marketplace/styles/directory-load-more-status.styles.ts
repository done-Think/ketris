import type { SxProps, Theme } from '@mui/material'

export const styles = {
  box: {
    minHeight: 72,
    display: 'grid',
    placeItems: 'center',
    mt: 2,
  },
  typography: { color: 'text.secondary', fontSize: 13, fontWeight: 500 },
} satisfies Record<string, SxProps<Theme>>
