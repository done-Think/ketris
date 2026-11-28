import type { SxProps, Theme } from '@mui/material'

import { brand, iconSize, motion, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  cardButton: {
    width: 38,
    height: 38,
    bgcolor: surface.paper,
    color: 'primary.main',
    boxShadow: shadows.propertyCard,
    transition: motion.transition.interactive,
    '&:hover': { bgcolor: surface.paper, transform: 'scale(1.08)' },
  },
  cardIcon: { fontSize: iconSize.xl },
  loginPaper: { borderRadius: `${radius.lg}px` },
  loginContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 1.5,
    px: 3,
    pt: 4,
    pb: 3,
  },
  favoriteIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 76,
    height: 76,
    borderRadius: `${radius.full}px`,
    bgcolor: brand.magenta[50],
    color: 'primary.main',
  },
  loginActions: { width: '100%', mt: 1 },
  cardWrapper: {
    position: 'relative',
    '&:hover [data-favorite-slot]': { transform: 'translateY(-3px)' },
    '&:has([data-highlighted="true"]) [data-favorite-slot]': { transform: 'translateY(-2px)' },
  },
} satisfies Record<string, SxProps<Theme>>

export function getFavoriteSlotStyles({ isListView }: { isListView: boolean }): SxProps<Theme> {
  return {
    position: 'absolute',
    top: 12,
    right: { xs: 12, md: isListView ? 'calc(50% + 12px)' : 12 },
    transition: motion.transition.card,
  }
}
