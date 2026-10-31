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
  propertyIcon: { fontSize: 16 },
  locationNotice: {
    position: 'absolute',
    bottom: 36,
    left: 12,
    right: 56,
    zIndex: 1,
    bgcolor: surface.paper,
    color: 'text.secondary',
    borderRadius: 1,
    px: 1.5,
    py: 1,
    fontSize: 12,
    pointerEvents: 'none',
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
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.5,
    whiteSpace: 'nowrap',
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
