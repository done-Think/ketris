import type { SxProps, Theme } from '@mui/material'
import type { SearchResultProperty } from '../types/search'
import { alpha } from '@shared/theme/tokens'
import { motion } from '@shared/theme/tokens'
import { shadows } from '@shared/theme/tokens'
import { radius } from '@shared/theme/tokens'
import { componentText, iconSize } from '@shared/theme/tokens'

export const styles = {
  box: { position: 'absolute', top: 12, left: 12 },
  typography: { color: 'text.secondary', ...componentText.cardEyebrow, mb: 0.55 },
  typography2: { ...componentText.cardTitle, mb: 0.7 },
  typography3: { ...componentText.cardPrice, mb: 1.25 },
  stack: { mb: 1.6 },
  icon: { color: 'text.secondary', fontSize: iconSize.xs },
  divider: { mb: 1.4 },
  stack2: { minWidth: 0 },
  avatar: { width: 28, height: 28 },
  typography4: { color: 'primary.main', ...componentText.cardAction },
  chevronRightIcon: { color: 'primary.main', fontSize: iconSize.sm },
} satisfies Record<string, SxProps<Theme>>

export function getCardStyles({
  isListView,
  selected,
}: {
  isListView: boolean
  selected: boolean
}): SxProps<Theme> {
  return {
    display: { xs: 'block', md: isListView ? 'flex' : 'block' },
    overflow: 'hidden',
    border: '1px solid',
    borderColor: selected ? 'primary.main' : 'transparent',
    borderRadius: `${radius.sm}px`,
    color: 'inherit',
    textDecoration: 'none',
    boxShadow: selected ? shadows.propertyCardHover : shadows.propertyCard,
    transition: motion.transition.card,
    transform: selected ? 'translateY(-2px)' : 'none',
    '&:hover': {
      boxShadow: shadows.propertyCardHover,
      transform: 'translateY(-3px)',
      borderColor: alpha.magenta[14],
    },
  }
}

export function getBoxStyles({
  isListView,
  property,
}: {
  isListView: boolean
  property: SearchResultProperty
}): SxProps<Theme> {
  return {
    position: 'relative',
    flex: { md: isListView ? '0 0 50%' : undefined },
    width: { md: isListView ? '50%' : '100%' },
    minHeight: { md: isListView ? 260 : undefined },
    height: isListView ? { xs: 180, md: 'auto' } : { xs: 180, md: 150, xl: 175 },
    backgroundImage: `url("${property.image}")`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  }
}

export function getCardContentStyles({ isListView }: { isListView: boolean }): SxProps<Theme> {
  return {
    display: 'flex',
    flex: { md: isListView ? '0 0 50%' : undefined },
    width: { md: isListView ? '50%' : 'auto' },
    flexDirection: 'column',
    justifyContent: 'space-between',
    p: { xs: 2, xl: 2.25 },
  }
}
