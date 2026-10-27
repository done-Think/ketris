import type { SxProps, Theme } from '@mui/material'
import type { PublicProfileListing } from '../types/profile-listings'
import { motion } from '@shared/theme/tokens'
import { shadows } from '@shared/theme/tokens'
import { surface } from '@shared/theme/tokens'
import { alpha, componentText, iconSize, radius } from '@shared/theme/tokens'

export const styles = {
  typography: { mb: 1.5 },
  box: {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      md: 'repeat(2, minmax(0, 1fr))',
      lg: 'repeat(3, minmax(0, 1fr))',
    },
    gap: { xs: 2, xl: 2.5 },
  },
  box2: { p: 2 },
  stack: { mb: 0.6 },
  typography2: { color: 'text.secondary', ...componentText.cardEyebrow },
  typography3: { ...componentText.cardTitle, mt: 0.6, mb: 0.8 },
  stack2: { mb: 1.6 },
  chip: {
    height: 26,
    borderRadius: `${radius.sm}px`,
    bgcolor: alpha.graphite[6],
    fontSize: 11,
  },
  homeWorkOutlinedIcon: { fontSize: iconSize.sm },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({ accentColor }: { accentColor: string }): SxProps<Theme> {
  return {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    boxShadow: shadows.propertyCard,
    overflow: 'hidden',
    color: 'inherit',
    display: 'block',
    textDecoration: 'none',
    transition: motion.transition.card,
    '&:hover': {
      boxShadow: shadows.propertyCardHover,
      transform: 'translateY(-2px)',
    },
    '&:focus-visible': {
      outline: `2px solid ${accentColor}`,
      outlineOffset: 3,
    },
  }
}

export function getBoxStyles2({ listing }: { listing: PublicProfileListing }): SxProps<Theme> {
  return {
    height: 190,
    bgcolor: surface.app,
    backgroundImage: listing.image ? `url("${listing.image}")` : undefined,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  }
}

export function getPlaceOutlinedIconStyles({
  accentColor,
}: {
  accentColor: string
}): SxProps<Theme> {
  return { color: accentColor, fontSize: iconSize.xs }
}

export function getTypographyStyles({ accentColor }: { accentColor: string }): SxProps<Theme> {
  return { color: accentColor, ...componentText.cardPrice, mb: 1.3 }
}

export function getBoxStyles3({ accentColor }: { accentColor: string }): SxProps<Theme> {
  return {
    bgcolor: accentColor,
    borderRadius: `${radius.sm}px`,
    color: surface.paper,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.8,
    minHeight: 36,
    px: 2,
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.25,
  }
}
