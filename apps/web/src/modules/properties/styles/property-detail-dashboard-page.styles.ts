import type { SxProps, Theme } from '@mui/material'

export const styles = {
  stack: { minHeight: '55vh' },
  box: { width: '100%', p: 3.5 },
  typography: { mb: 2 },
  box2: { flex: 1, minWidth: 0, width: '100%' },
} satisfies Record<string, SxProps<Theme>>
