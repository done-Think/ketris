import type { SxProps, Theme } from '@mui/material'

export const styles = {
  stack: { p: 4 },
  typography: { p: 4 },
  box: { width: '100%', p: 3.5 },
  stack2: {
    width: '100%',
    minHeight: { md: 'calc(100vh - 68px)' },
  },
} satisfies Record<string, SxProps<Theme>>
