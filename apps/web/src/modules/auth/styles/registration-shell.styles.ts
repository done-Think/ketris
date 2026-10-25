import type { SxProps, Theme } from '@mui/material'
import { surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    minHeight: '100dvh',
    bgcolor: surface.app,
  },
  box2: {
    width: '100%',
    maxWidth: 832,
    minHeight: '100dvh',
    mx: 'auto',
    px: { xs: 2.5, sm: 4 },
    pt: { xs: 2.5, sm: 4 },
    pb: { xs: 3, sm: 6 },
    display: 'flex',
    flexDirection: 'column',
  },
  box3: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
} satisfies Record<string, SxProps<Theme>>
