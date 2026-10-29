import type { SxProps, Theme } from '@mui/material'
import { alpha, componentText, iconSize, motion, radius, shadows } from '@shared/theme/tokens'

export const styles = {
  card: {
    border: '1px solid',
    borderColor: 'transparent',
    borderRadius: `${radius.sm}px`,
    color: 'inherit',
    boxShadow: shadows.propertyCard,
    cursor: 'pointer',
    overflow: 'hidden',
    position: 'relative',
    transition: motion.transition.card,
    '&:hover': {
      borderColor: alpha.magenta[14],
      boxShadow: shadows.propertyCardHover,
      transform: 'translateY(-3px)',
    },
  },
  box: {
    position: 'absolute',
    inset: 0,
    zIndex: 3,
    borderRadius: `${radius.sm}px`,
    pointerEvents: 'none',
    textDecoration: 'none',
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: 3,
    },
  },
  typography: { color: 'text.secondary', ...componentText.cardBroker },
  typography2: {
    color: 'text.secondary',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.5,
    mt: 0.8,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  stack: { mt: 1.8 },
  chip: {
    height: 26,
    borderRadius: `${radius.sm}px`,
    bgcolor: alpha.magenta[6],
    color: 'primary.main',
    fontSize: 11,
    fontWeight: 700,
  },
  stack2: { textDecoration: 'none' },
  typography3: { color: 'primary.main', ...componentText.cardAction },
  chevronRightIcon: { color: 'primary.main', fontSize: iconSize.sm },
} satisfies Record<string, SxProps<Theme>>

export function getCardContentStyles({ isListView }: { isListView: boolean }): SxProps<Theme> {
  return {
    p: { xs: 2, md: isListView ? 2 : 2.2 },
    position: 'relative',
    zIndex: 2,
    '& a': {
      position: 'relative',
      zIndex: 4,
    },
  }
}

export function getBoxStyles({ isListView }: { isListView: boolean }): SxProps<Theme> {
  return {
    minWidth: 0,
    display: isListView ? 'flex' : 'block',
    flexDirection: 'column',
    height: isListView ? '100%' : 'auto',
  }
}

export function getBoxStyles2({ isListView }: { isListView: boolean }): SxProps<Theme> {
  return { mb: isListView ? 1.4 : 1.2 }
}

export function getBoxStyles3({ isListView }: { isListView: boolean }): SxProps<Theme> {
  return { mt: isListView ? 'auto' : 0, pt: isListView ? 2 : 0 }
}

export function getDividerStyles({ isListView }: { isListView: boolean }): SxProps<Theme> {
  return { my: isListView ? 1.6 : 1.8 }
}
