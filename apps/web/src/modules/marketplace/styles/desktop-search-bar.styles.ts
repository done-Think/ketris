import type { SxProps, Theme } from '@mui/material'
import { componentText, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  stack: {
    bgcolor: surface.paper,
    borderRadius: `${radius.sm}px`,
    p: { md: 0.8, xl: 1.3 },
    width: '100%',
    maxWidth: { md: 820, lg: '100%', xl: '100%' },
    boxSizing: 'border-box',
    boxShadow: shadows.heroSearch,
    display: { xs: 'none', md: 'flex' },
    position: 'relative',
    overflow: 'visible',
  },
  box: {
    flex: { md: '0 0 104px', xl: '0 0 118px' },
    minWidth: { md: 104, xl: 118 },
    ml: { md: 0.7, xl: 0.9 },
    textDecoration: 'none',
  },
  button: {
    width: '100%',
    minHeight: { md: 40, xl: 55 },
    px: 0,
    borderRadius: `${radius.sm}px`,
    ...componentText.desktopSearchButton,
  },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({
  key,
  index,
}: {
  key: 'location' | 'propertyType' | 'priceRange'
  index: number
}): SxProps<Theme> {
  return {
    flex:
      key === 'location'
        ? { md: '1.35 1 0', xl: '1.35 1 0' }
        : key === 'priceRange'
          ? { md: '1.45 1 0', xl: '1.45 1 0' }
          : '1 1 0',
    minWidth: 0,
    position: 'relative',
    borderRight: index < 2 ? { xs: 0, md: '1px solid' } : 0,
    borderColor: 'divider',
  }
}
