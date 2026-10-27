import type { SxProps, Theme } from '@mui/material'

export const styles = {
  box: {
    display: { xs: 'none', lg: 'block' },
    alignSelf: 'start',
    position: { lg: 'sticky' },
    top: { lg: 68 },
    height: { lg: 'calc(100vh - 76px)' },
    minHeight: { lg: 620 },
    minWidth: 0,
    p: 1,
    pl: 0,
  },
} satisfies Record<string, SxProps<Theme>>
