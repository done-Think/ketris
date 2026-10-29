import type { SxProps, Theme } from '@mui/material'
import type { ViewMode } from '../types/search'
import { radius, surface } from '@shared/theme/tokens'

export const styles = {
  skeleton: { borderRadius: 1.5 },
  box: {
    gridColumn: '1 / -1',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    px: 2,
    py: 4,
    textAlign: 'center',
  },
  typography: { fontWeight: 900, mb: 0.5 },
  typography2: { color: 'text.secondary', fontSize: 13, fontWeight: 700 },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({ viewMode }: { viewMode: ViewMode }): SxProps<Theme> {
  return {
    display: 'grid',
    gridTemplateColumns:
      viewMode === 'grid' ? { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } : '1fr',
    gap: { xs: 2, xl: 2.5 },
  }
}
