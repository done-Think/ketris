import type { SxProps, Theme } from '@mui/material'
import type { ViewMode } from '../types/search'
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
  box2: { py: { xs: 2.4, md: 4 } },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({ viewMode }: { viewMode: ViewMode }): SxProps<Theme> {
  return {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      md: viewMode === 'list' ? '1fr' : 'repeat(2, minmax(0, 1fr))',
      xl: viewMode === 'list' ? '1fr' : 'repeat(3, minmax(0, 1fr))',
    },
    gap: { xs: 2, xl: 2.5 },
  }
}
