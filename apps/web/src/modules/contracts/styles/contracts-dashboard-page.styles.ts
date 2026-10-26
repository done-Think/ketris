import type { SxProps, Theme } from '@mui/material'

export const styles = {
  box: { width: '100%', p: 3.5 } satisfies SxProps<Theme>,
  stack: {
    width: '100%',
    minHeight: { md: 'calc(100vh - 68px)' },
  } satisfies SxProps<Theme>,
}
