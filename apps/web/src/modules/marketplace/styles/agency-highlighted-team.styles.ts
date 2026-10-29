import type { SxProps, Theme } from '@mui/material'
import { componentText } from '@shared/theme/tokens'
import { shadows } from '@shared/theme/tokens'
import { motion } from '@shared/theme/tokens'
import { radius, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    p: { xs: 2, md: 2.4 },
    mb: 2.5,
  },
  typography: { mb: 1.4 },
  box2: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
    gap: 1.2,
  },
  avatar: { width: 42, height: 42, flexShrink: 0 },
  box3: { minWidth: 0 },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({
  brand,
}: {
  brand: {
    primaryColor: string | null
    secondaryColor: string | null
    backgroundColor: string | null
    logoUrl: string | null
  }
}): SxProps<Theme> {
  return {
    alignItems: 'center',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: brand.backgroundColor,
    color: 'inherit',
    display: 'flex',
    gap: 1.2,
    minHeight: 68,
    px: 1.2,
    py: 1,
    textDecoration: 'none',
    transition: motion.transition.card,
    '&:hover': {
      borderColor: brand.primaryColor,
      boxShadow: shadows.propertyCard,
    },
    '&:focus-visible': {
      outline: `2px solid ${brand.primaryColor}`,
      outlineOffset: 3,
    },
  }
}

export function getTypographyStyles({
  brand,
}: {
  brand: {
    primaryColor: string | null
    secondaryColor: string | null
    backgroundColor: string | null
    logoUrl: string | null
  }
}): SxProps<Theme> {
  return {
    color: brand.secondaryColor,
    ...componentText.profileTeamName,
  }
}
