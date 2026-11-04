import type { SxProps, Theme } from '@mui/material'
import { surface } from '@shared/theme/tokens'

export const styles = {
  screen: {
    minHeight: '100dvh',
    width: '100%',
    p: 3,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    bgcolor: surface.app,
  },
} satisfies Record<string, SxProps<Theme>>
