import type { SxProps, Theme } from '@mui/material'
import { surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    minHeight: '100dvh',
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'minmax(390px, 39.8%) minmax(0, 60.2%)' },
    gridTemplateRows: { xs: 'auto 1fr', md: '1fr' },
    bgcolor: surface.paper,
  },
  box2: {
    display: 'flex',
    justifyContent: 'center',
    px: { xs: 2.5, sm: 5, lg: 7 },
    pt: { xs: 4, md: 10 },
    pb: { xs: 5, md: 7 },
    bgcolor: surface.paper,
  },
  box3: { width: '100%', maxWidth: 550 },
  box4: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  typography: { color: 'primary.main' },
  typography2: { mt: 0.75 },
} satisfies Record<string, SxProps<Theme>>
