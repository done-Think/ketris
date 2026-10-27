import type { SxProps, Theme } from '@mui/material'
import { radius } from '@shared/theme/tokens'
import { alpha, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 230px' },
    gap: 1,
    mb: 3,
  },
  box2: {
    display: { xs: 'none', md: 'grid' },
    gridTemplateRows: 'repeat(3, 1fr)',
    gap: 1,
  },
  box3: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    bgcolor: alpha.graphite[52],
    color: surface.lightText,
    fontWeight: 900,
  },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({ cover }: { cover: string }): SxProps<Theme> {
  return {
    minHeight: { xs: 300, md: 470 },
    borderRadius: `${radius.sm}px`,
    backgroundImage: `url("${cover}")`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    border: 0,
    cursor: 'pointer',
    display: 'block',
    p: 0,
    width: '100%',
  }
}

export function getBoxStyles2({ image }: { image: string }): SxProps<Theme> {
  return {
    position: 'relative',
    borderRadius: `${radius.sm}px`,
    backgroundImage: `url("${image}")`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    border: 0,
    cursor: 'pointer',
    overflow: 'hidden',
    p: 0,
  }
}
