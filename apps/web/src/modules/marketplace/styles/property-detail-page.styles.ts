import type { SxProps, Theme } from '@mui/material'
import { surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    display: 'flex',
    flexDirection: 'column',
    bgcolor: surface.app,
    minHeight: '100vh',
    overflowX: 'clip',
  },
  container: { py: { xs: 2.5, md: 4 } },
  box2: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 355px' },
    gap: { xs: 2.5, lg: 3.5 },
    alignItems: 'start',
  },
  box3: { minWidth: 0 },
} satisfies Record<string, SxProps<Theme>>
