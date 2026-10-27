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
  box2: { minWidth: 0 },
  box3: { minWidth: 0, flex: 1 },
  typography: { ...componentText.cardTitle, mb: 0.4 },
  typography2: { color: 'text.secondary', ...componentText.cardBroker },
  typography3: { color: 'text.secondary', ...componentText.cardMeta, mt: 1 },
  typography4: {
    color: 'text.secondary',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.5,
    mt: 1.2,
  },
  stack: { mt: 1.8 },
  chip: {
    height: 26,
    borderRadius: `${radius.sm}px`,
    bgcolor: alpha.magenta[6],
    color: 'primary.main',
    fontSize: 11,
    fontWeight: 800,
  },
  stack2: { textDecoration: 'none' },
  typography5: { color: 'primary.main', ...componentText.cardAction },
  chevronRightIcon: { color: 'primary.main', fontSize: iconSize.sm },
} satisfies Record<string, SxProps<Theme>>

export function getCardContentStyles({ isListView }: { isListView: boolean }): SxProps<Theme> {
  return {
    p: { xs: 2, md: isListView ? 2.6 : 2.4 },
    position: 'relative',
    zIndex: 2,
    '& a': {
      position: 'relative',
      zIndex: 4,
    },
  }
}

export function getAvatarStyles({ isListView }: { isListView: boolean }): SxProps<Theme> {
  return {
    width: isListView ? { xs: 68, md: 86 } : 58,
    height: isListView ? { xs: 68, md: 86 } : 58,
    boxShadow: `0 0 0 3px ${alpha.magenta[8]}`,
  }
}

export function getDividerStyles({ isListView }: { isListView: boolean }): SxProps<Theme> {
  return { my: isListView ? 1.6 : 1.8 }
}
