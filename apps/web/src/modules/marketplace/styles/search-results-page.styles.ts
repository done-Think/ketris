import type { SxProps, Theme } from '@mui/material'
import { surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    width: '100%',
    maxWidth: '100vw',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'clip',
    bgcolor: surface.app,
  },
  box2: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.08fr) minmax(430px, 0.92fr)' },
    minHeight: 'calc(100vh - 60px)',
  },
  box3: {
    px: { xs: 2, sm: 3, xl: 5 },
    py: { xs: 2, md: 3 },
    minWidth: 0,
  },
  alert: { mb: 2 },
} satisfies Record<string, SxProps<Theme>>
