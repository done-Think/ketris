import type { SxProps, Theme } from '@mui/material'

export const styles = {
  stack: { mb: 2 },
  typography: { color: 'text.secondary', fontSize: 12, fontWeight: 700 },
  typography2: {
    color: 'text.secondary',
    fontSize: 12,
    fontWeight: 700,
    textDecoration: 'none',
    '&:hover': {
      color: 'primary.main',
      textDecoration: 'underline',
    },
  },
  typography3: { color: 'primary.main', fontSize: 12, fontWeight: 700 },
} satisfies Record<string, SxProps<Theme>>
