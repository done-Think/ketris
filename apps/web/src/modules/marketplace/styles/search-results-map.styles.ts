import type { SxProps, Theme } from '@mui/material'
import { motion } from '@shared/theme/tokens'
import { componentText } from '@shared/theme/tokens'
import { shadows } from '@shared/theme/tokens'
import { radius, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    position: 'relative',
    height: { xs: 360, lg: '100%' },
    overflow: 'hidden',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.darkDeep,
  },
  viewerMarker: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    bgcolor: 'info.main',
    border: '2px solid',
    borderColor: surface.paper,
  },
  resultsButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
    bgcolor: surface.paper,
    color: 'text.primary',
    '&:hover': { bgcolor: surface.paper },
  },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({ selected }: { selected: boolean }): SxProps<Theme> {
  return {
    minWidth: selected ? 104 : 86,
    height: selected ? 34 : 30,
    px: 1.2,
    border: '1px solid',
    borderColor: selected ? 'primary.main' : 'divider',
    borderRadius: radius.full,
    bgcolor: selected ? 'primary.main' : surface.paper,
    boxShadow: selected ? shadows.propertyCardHover : shadows.propertyCard,
    color: selected ? surface.lightText : 'primary.main',
    cursor: 'pointer',
    display: 'inline-grid',
    placeItems: 'center',
    textDecoration: 'none',
    ...componentText.resetButtonText,
    fontSize: selected ? 13 : 12,
    fontWeight: 900,
    transition: motion.transition.card,
    transform: selected ? 'translateY(-2px)' : 'none',
    '&:hover': {
      boxShadow: shadows.propertyCardHover,
      transform: 'translateY(-2px)',
    },
  }
}
