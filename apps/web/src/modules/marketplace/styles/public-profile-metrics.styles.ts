import type { SxProps, Theme } from '@mui/material'
import { iconSize } from '@shared/theme/tokens'
import { radius, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, 1fr)' },
    gap: 1,
    mb: 2.5,
  },
  box2: {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    px: 1.5,
    py: 1.3,
  },
  typography: { color: 'text.secondary', fontSize: 11, fontWeight: 500 },
} satisfies Record<string, SxProps<Theme>>

export function getMetricIconStyles({ accentColor }: { accentColor: string }): SxProps<Theme> {
  return { color: accentColor, fontSize: iconSize.md, mb: 0.4 }
}

export function getTypographyStyles({ accentColor }: { accentColor: string }): SxProps<Theme> {
  return { color: accentColor, fontSize: 20, fontWeight: 700 }
}
