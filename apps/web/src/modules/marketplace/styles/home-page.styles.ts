import type { SxProps, Theme } from '@mui/material'

import { surface } from '@shared/theme/tokens'

export const styles = {
  page: {
    width: '100%',
    maxWidth: '100vw',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'clip',
    bgcolor: surface.app,
  },
} satisfies Record<string, SxProps<Theme>>
